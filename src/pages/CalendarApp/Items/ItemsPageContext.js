import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getItemSummary, getMasters } from "../../../helpers/calendar_api";

export const ITEM_TABS = [
  { key: "all", label: "All Items", countKey: "allItems", color: "#556ee6" },
  { key: "pending", label: "Pending", countKey: "pending", color: "#FB8C00" },
  { key: "completed", label: "Completed", countKey: "completed", color: "#43A047" },
  { key: "overdue", label: "Overdue", countKey: "overdue", color: "#E53935" },
  { key: "payment", label: "Payment", countKey: "payment", color: "#FB8C00" },
  { key: "meeting", label: "Meeting", countKey: "meeting", color: "#43A047" },
  { key: "compliance", label: "Compliance", countKey: "compliance", color: "#5E35B1" },
  { key: "personal", label: "Personal", countKey: "personal", color: "#8E24AA" },
  { key: "recurring", label: "Recurring", countKey: "recurring", color: "#1E88E5", sidebarOnly: true },
];

export const ITEM_TAB_KEYS = ITEM_TABS.filter((t) => !t.sidebarOnly).map((t) => t.key);

const defaultCounts = {
  allItems: 0,
  pending: 0,
  completed: 0,
  overdue: 0,
  payment: 0,
  meeting: 0,
  compliance: 0,
  personal: 0,
  recurring: 0,
};

const ItemsPageContext = createContext(null);

export const ItemsPageProvider = ({ children }) => {
  const [tab, setTabState] = useState("all");
  const [counts, setCounts] = useState(defaultCounts);
  const [masters, setMasters] = useState(null);
  const [calendarId, setCalendarId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [summary, m] = await Promise.all([
          getItemSummary().catch(() => null),
          getMasters().catch(() => ({})),
        ]);
        if (summary) {
          setCounts({
            allItems: summary.allItems ?? 0,
            pending: summary.pending ?? 0,
            completed: summary.completed ?? 0,
            overdue: summary.overdue ?? 0,
            payment: summary.payment ?? 0,
            meeting: summary.meeting ?? 0,
            compliance: summary.compliance ?? 0,
            personal: summary.personal ?? 0,
            recurring: summary.recurring ?? 0,
          });
        }
        setMasters(m || {});
      } catch {
        setMasters({});
      }
    };
    load();
  }, []);

  const setTab = useCallback((key) => {
    setTabState(key);
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const summary = await getItemSummary();
      if (summary) {
        setCounts({
          allItems: summary.allItems ?? 0,
          pending: summary.pending ?? 0,
          completed: summary.completed ?? 0,
          overdue: summary.overdue ?? 0,
          payment: summary.payment ?? 0,
          meeting: summary.meeting ?? 0,
          compliance: summary.compliance ?? 0,
          personal: summary.personal ?? 0,
          recurring: summary.recurring ?? 0,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const buildItemParams = useCallback(
    (extra = {}) => {
      const params = {
        page: 1,
        pageSize: 10,
        ...extra,
      };
      if (calendarId) params.calendarId = calendarId;
      if (priorityId) params.priorityId = priorityId;
      if (assigneeUserId) params.assigneeUserId = assigneeUserId;

      const statuses = masters?.statuses || [];
      const itemTypes = masters?.itemTypes || [];
      const categories = masters?.categories || [];

      const findStatus = (...names) =>
        statuses.find((s) =>
          names.some((n) => String(s.name).toLowerCase() === n.toLowerCase())
        )?.id;

      const findType = (...names) =>
        itemTypes.find((t) =>
          names.some((n) => String(t.name).toLowerCase().includes(n.toLowerCase()))
        )?.id;

      const findCategory = (...names) =>
        categories.find((c) =>
          names.some((n) => String(c.name).toLowerCase().includes(n.toLowerCase()))
        )?.id;

      switch (tab) {
        case "pending":
          params.statusId = findStatus("pending");
          break;
        case "completed":
          params.statusId = findStatus("completed");
          break;
        case "overdue":
          params.overdueOnly = true;
          break;
        case "payment":
          params.itemTypeId = findType("payment");
          break;
        case "meeting":
          params.itemTypeId = findType("meeting");
          break;
        case "compliance":
          params.categoryId = findCategory("compliance");
          break;
        case "personal":
          params.categoryId = findCategory("personal");
          if (!params.categoryId) params.itemTypeId = findType("personal");
          break;
        case "recurring":
          params.recurringOnly = true;
          break;
        default:
          break;
      }

      return params;
    },
    [tab, calendarId, priorityId, assigneeUserId, masters]
  );

  const clearDropdownFilters = useCallback(() => {
    setCalendarId("");
    setPriorityId("");
    setAssigneeUserId("");
  }, []);

  const value = useMemo(
    () => ({
      tab,
      setTab,
      counts,
      refreshCounts,
      masters,
      calendarId,
      setCalendarId,
      priorityId,
      setPriorityId,
      assigneeUserId,
      setAssigneeUserId,
      clearDropdownFilters,
      buildItemParams,
    }),
    [
      tab,
      setTab,
      counts,
      refreshCounts,
      masters,
      calendarId,
      priorityId,
      assigneeUserId,
      clearDropdownFilters,
      buildItemParams,
    ]
  );

  return (
    <ItemsPageContext.Provider value={value}>{children}</ItemsPageContext.Provider>
  );
};

export const useItemsPage = () => {
  const ctx = useContext(ItemsPageContext);
  if (!ctx) throw new Error("useItemsPage must be used within ItemsPageProvider");
  return ctx;
};

export const useItemsPageOptional = () => useContext(ItemsPageContext);
