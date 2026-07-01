"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteNotificationsAction,
  markNotificationReadAction,
  markNotificationsReadAction
} from "@/app/studio-notification-actions";
import { StudioMessageDetailPanel } from "@/components/studioos/studio-message-detail-panel";
import { StudioMessageListPanel } from "@/components/studioos/studio-message-list-panel";
import { StudioMessagesStatCards } from "@/components/studioos/studio-messages-stat-cards";
import type {
  MessageCategory,
  MessageDetailPayload,
  MessageListItem
} from "@/components/studioos/studio-message-center.types";
import type { Locale } from "@/lib/i18n";
import {
  buildMessageStatCards,
  countMessagesByCategory,
  type MessageStatCard
} from "@/lib/studioos/creator-messages-ui";

type FilterTab = "all" | "unread" | "read";

type MessageCenterActions = {
  markRead: (formData: FormData) => Promise<{ ok: boolean }>;
  markManyRead: (formData: FormData) => Promise<{ ok: boolean }>;
  deleteMany: (
    formData: FormData
  ) => Promise<{ ok: boolean; deleted?: number; error?: string }>;
};

const defaultActions: MessageCenterActions = {
  markRead: markNotificationReadAction,
  markManyRead: markNotificationsReadAction,
  deleteMany: deleteNotificationsAction
};

const PAGE_SIZE = 8;

const copy = {
  zh: {
    confirmDeleteSelected: "确定删除选中的消息吗？此操作不可恢复。",
    deleteFailed: "删除失败，请稍后重试。"
  },
  en: {
    confirmDeleteSelected: "Delete selected messages? This cannot be undone.",
    deleteFailed: "Delete failed. Please try again."
  }
} as const;

export function StudioMessageCenter({
  locale,
  list,
  details,
  initialSelectedId = null,
  actions = defaultActions,
  statCards: statCardsOverride
}: {
  locale: Locale;
  list: MessageListItem[];
  details: MessageDetailPayload[];
  initialSelectedId?: string | null;
  actions?: MessageCenterActions;
  statCards?: MessageStatCard[];
}) {
  const t = copy[locale];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<MessageCategory | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? list[0]?.id ?? null
  );
  const [readOverrides, setReadOverrides] = useState<Record<string, string>>({});
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  const visibleList = useMemo(
    () => list.filter((item) => !hiddenIds.includes(item.id)),
    [hiddenIds, list]
  );

  const effectiveList = useMemo(
    () =>
      visibleList.map((item) =>
        readOverrides[item.id] ? { ...item, readAt: readOverrides[item.id] } : item
      ),
    [visibleList, readOverrides]
  );

  const detailMap = useMemo(
    () => new Map(details.map((item) => [item.notificationId, item])),
    [details]
  );
  const statCounts = useMemo(() => countMessagesByCategory(effectiveList), [effectiveList]);
  const statCards = useMemo(
    () => statCardsOverride ?? buildMessageStatCards(statCounts, locale),
    [locale, statCardsOverride, statCounts]
  );

  const categoryFiltered = useMemo(() => {
    if (categoryFilter === "all") return effectiveList;
    return effectiveList.filter((item) => item.category === categoryFilter);
  }, [categoryFilter, effectiveList]);

  const tabFiltered = useMemo(() => {
    if (tab === "unread") return categoryFiltered.filter((item) => !item.readAt);
    if (tab === "read") return categoryFiltered.filter((item) => item.readAt);
    return categoryFiltered;
  }, [categoryFiltered, tab]);

  const unreadCount = categoryFiltered.filter((item) => !item.readAt).length;
  const readCount = categoryFiltered.filter((item) => item.readAt).length;
  const totalPages = Math.max(1, Math.ceil(tabFiltered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = tabFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selected = selectedId ? detailMap.get(selectedId) ?? null : null;

  useEffect(() => {
    setPage(1);
  }, [tab, categoryFilter]);

  useEffect(() => {
    if (selectedId && !effectiveList.some((item) => item.id === selectedId)) {
      setSelectedId(effectiveList[0]?.id ?? null);
    }
  }, [effectiveList, selectedId]);

  function markReadLocally(id: string) {
    setReadOverrides((current) => ({
      ...current,
      [id]: new Date().toISOString()
    }));
  }

  function selectMessage(item: MessageListItem) {
    setSelectedId(item.id);
    if (!item.readAt) {
      startTransition(async () => {
        const fd = new FormData();
        fd.set("notification_id", item.id);
        const result = await actions.markRead(fd);
        if (result.ok) {
          markReadLocally(item.id);
          router.refresh();
        }
      });
    }
  }

  useEffect(() => {
    const initialId = initialSelectedId ?? list[0]?.id;
    if (!initialId) return;
    const item = list.find((entry) => entry.id === initialId);
    if (!item || item.readAt || readOverrides[item.id]) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("notification_id", item.id);
      const result = await actions.markRead(fd);
      if (result.ok) {
        markReadLocally(item.id);
        router.refresh();
      }
    });
    // Mark the initially opened message as read once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSelectId(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = pageItems.map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...visibleIds])]);
  }

  function markSelectedRead() {
    const ids = selectedIds.length
      ? selectedIds
      : pageItems.filter((item) => !item.readAt).map((item) => item.id);
    if (!ids.length) return;

    startTransition(async () => {
      const fd = new FormData();
      fd.set("notification_ids", ids.join(","));
      const result = await actions.markManyRead(fd);
      if (!result.ok) {
        return;
      }
      setReadOverrides((current) => {
        const next = { ...current };
        const now = new Date().toISOString();
        for (const id of ids) {
          next[id] = now;
        }
        return next;
      });
      setSelectedIds([]);
      router.refresh();
    });
  }

  function deleteSelected() {
    if (!selectedIds.length) return;
    if (!window.confirm(t.confirmDeleteSelected)) return;

    const idsToDelete = [...selectedIds];
    const deletingSelectedId = idsToDelete.includes(selectedId ?? "");

    startTransition(async () => {
      const fd = new FormData();
      fd.set("notification_ids", idsToDelete.join(","));
      fd.set("lang", locale);
      const result = await actions.deleteMany(fd);
      if (!result.ok) {
        window.alert(result.error ?? t.deleteFailed);
        return;
      }
      setHiddenIds((current) => [...new Set([...current, ...idsToDelete])]);
      setSelectedIds((current) => current.filter((id) => !idsToDelete.includes(id)));
      if (deletingSelectedId) {
        setSelectedId(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <StudioMessagesStatCards
        cards={statCards}
        activeCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:items-start">
        <StudioMessageListPanel
          locale={locale}
          items={pageItems}
          selectedId={selectedId}
          selectedIds={selectedIds}
          tab={tab}
          unreadCount={unreadCount}
          readCount={readCount}
          page={safePage}
          totalPages={totalPages}
          isPending={isPending}
          onTabChange={setTab}
          onSelect={selectMessage}
          onToggleSelect={toggleSelectId}
          onToggleSelectAll={toggleSelectAllVisible}
          onMarkRead={markSelectedRead}
          onDeleteSelected={deleteSelected}
          onPageChange={setPage}
        />
        <StudioMessageDetailPanel locale={locale} detail={selected} />
      </div>
    </div>
  );
}
