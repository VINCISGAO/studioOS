"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE } from "@/lib/auth-config";
import { parseDemoSession } from "@/lib/demo-auth";
import type { Locale } from "@/lib/i18n";
import { deleteOrderForClient } from "@/lib/order-service";
import { deleteProjectForClient } from "@/lib/project-service";

function normalizeLang(raw: FormDataEntryValue | null): Locale {
  return raw === "zh" ? "zh" : "en";
}

async function requireBrandEmail(lang: Locale) {
  const cookieStore = await cookies();
  const session = parseDemoSession(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
  if (!session || session.role !== "client") {
    return { ok: false as const, error: lang === "zh" ? "请先以 Brand 身份登录" : "Sign in as a brand account" };
  }
  return { ok: true as const, email: session.email.toLowerCase() };
}

export async function deleteBrandProjectAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const auth = await requireBrandEmail(lang);
  if (!auth.ok) {
    return auth;
  }

  const projectId = String(formData.get("project_id") ?? "");

  if (!projectId) {
    return { ok: false as const, error: lang === "zh" ? "项目不存在" : "Project not found" };
  }

  const result = await deleteProjectForClient(projectId, auth.email);
  if (!result.ok) {
    const messages = {
      NOT_FOUND: lang === "zh" ? "项目不存在" : "Project not found",
      FORBIDDEN: lang === "zh" ? "演示项目不可删除" : "Demo project cannot be deleted",
      LOCKED:
        lang === "zh"
          ? "制作中的项目不可删除，请联系支持或等待完成"
          : "Active production projects cannot be deleted"
    };
    return { ok: false as const, error: messages[result.code] };
  }

  revalidatePath("/brand/projects", "page");
  revalidatePath("/brand", "page");
  return { ok: true as const };
}

export async function deleteBrandProjectsAction(formData: FormData) {
  const lang = normalizeLang(formData.get("lang"));
  const auth = await requireBrandEmail(lang);
  if (!auth.ok) {
    return auth;
  }

  const projectIds = formData
    .getAll("project_ids")
    .map((value) => String(value))
    .filter(Boolean);
  const orderIds = formData
    .getAll("order_ids")
    .map((value) => String(value))
    .filter(Boolean);

  if (!projectIds.length && !orderIds.length) {
    return { ok: false as const, error: lang === "zh" ? "请先选择要删除的项目" : "Select items to delete" };
  }

  const deletedProjects: string[] = [];
  const deletedOrders: string[] = [];
  const failures: { id: string; error: string }[] = [];

  const projectMessages = {
    NOT_FOUND: lang === "zh" ? "项目不存在" : "Project not found",
    FORBIDDEN: lang === "zh" ? "演示项目不可删除" : "Demo project cannot be deleted",
    LOCKED:
      lang === "zh" ? "制作中的项目不可删除" : "Active production projects cannot be deleted"
  };

  const orderMessages = {
    NOT_FOUND: lang === "zh" ? "订单不存在" : "Order not found",
    FORBIDDEN: lang === "zh" ? "演示订单不可删除" : "Demo order cannot be deleted",
    LOCKED:
      lang === "zh" ? "进行中的订单不可删除" : "Active orders cannot be deleted"
  };

  for (const projectId of projectIds) {
    const result = await deleteProjectForClient(projectId, auth.email);
    if (result.ok) {
      deletedProjects.push(projectId);
    } else {
      failures.push({ id: projectId, error: projectMessages[result.code] });
    }
  }

  for (const orderId of orderIds) {
    const result = await deleteOrderForClient(orderId, auth.email);
    if (result.ok) {
      deletedOrders.push(orderId);
    } else {
      failures.push({ id: orderId, error: orderMessages[result.code] });
    }
  }

  const deletedCount = deletedProjects.length + deletedOrders.length;

  if (deletedCount) {
    revalidatePath("/brand", "page");
    revalidatePath("/brand/projects", "page");
  }

  if (!deletedCount) {
    return {
      ok: false as const,
      error: failures[0]?.error ?? (lang === "zh" ? "删除失败" : "Delete failed"),
      stale: failures.every((item) => item.error === projectMessages.NOT_FOUND || item.error === orderMessages.NOT_FOUND)
    };
  }

  return {
    ok: true as const,
    deleted: deletedProjects,
    deletedOrders,
    failures
  };
}
