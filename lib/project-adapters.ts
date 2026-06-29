import { getProject } from "@/lib/project-service";
import { getOrder } from "@/lib/order-service";
import { promises as fs } from "fs";
import path from "path";
import type { ChatStore } from "@/lib/chat-types";

const CHAT_STORE_PATH = path.join(process.cwd(), ".data", "chat-store.json");

async function readChatStore(): Promise<ChatStore> {
  const raw = await fs.readFile(CHAT_STORE_PATH, "utf8");
  return JSON.parse(raw) as ChatStore;
}

export async function getProjectForOrder(orderId: string) {
  const order = await getOrder(orderId);
  if (!order?.project_id) {
    return null;
  }
  return getProject(order.project_id);
}

export async function getProjectForInquiry(inquiryId: string) {
  try {
    const store = await readChatStore();
    const inquiry = store.inquiries.find((item) => item.id === inquiryId);
    if (!inquiry?.project_id) {
      return null;
    }
    return getProject(inquiry.project_id);
  } catch {
    return null;
  }
}

export async function linkInquiryToProject(inquiryId: string, projectId: string) {
  const raw = await fs.readFile(CHAT_STORE_PATH, "utf8");
  const store = JSON.parse(raw) as ChatStore;
  const inquiry = store.inquiries.find((item) => item.id === inquiryId);
  if (!inquiry) {
    return false;
  }
  inquiry.project_id = projectId;
  const tempPath = `${CHAT_STORE_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempPath, CHAT_STORE_PATH);
  return true;
}
