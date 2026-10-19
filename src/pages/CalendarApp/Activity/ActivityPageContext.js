import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getActivityList,
  getActivitySummary,
  getMasters,
  getTopActiveUsers,
} from "../../../helpers/calendar_api";

export const ACTIVITY_TABS = [
  { key: "all", label: "All" },
  { key: "items", label: "Items" },
  { key: "assignments", label: "Assignments" },
  { key: "reminders", label: "Reminders" },
  { key: "attachments", label: "Attachments" },
  { key: "comments", label: "Comments" },
  { key: "system", label: "System" },
];

export const ACTIVITY_PERIODS = [
  { key: "", label: "All Activity", icon: "ri-bar-chart-2-line", color: "#556ee6" },
  { key: "today", label: "Today", icon: "ri-time-line", color: "#43A047" },
  { key: "yesterday", label: "Yesterday", icon: "ri-history-line", color: "#FB8C00" },
  { key: "this_week", label: "This Week", icon: "ri-calendar-line", color: "#7E57C2" },
  { key: "this_month", label: "This Month", icon: "ri-calendar-check-line", color: "#EC407A" },
  { key: "custom", label: "Custom Range", icon: "ri-calendar-event-line", color: "#E53935", custom: true },
];

export const ACTIVITY_TYPE_FILTERS = [
  { key: "created", label: "Created", color: "#556ee6", match: ["creat"] },
  { key: "updated", label: "Updated", color: "#43A047", match: ["update"] },
  { key: "assigned", label: "Assigned", color: "#FB8C00", match: ["assign"] },
  { key: "completed", label: "Completed", color: "#00ACC1", match: ["complet"] },
  { key: "deleted", label: "Deleted", color: "#E53935", match: ["delet"] },
  { key: "others", label: "Others", color: "#8E24AA", match: null },
];

const defaultSummary = {
  total: 0,
  updates: 0,
  assignments: 0,
  completions: 0,
  comments: 0,
  deletions: 0,
};

const ActivityPageContext = createContext(null);

const findTypeId = (masters, matchWords) => {
  if (!matchWords?.length || !masters?.activityTypes) return null;
  const found = masters.activityTypes.find((t) =>
    matchWords.some((m) => String(t.name).toLowerCase().includes(m))
  );
  return found?.id ?? null;
};

export const ActivityPageProvider = ({ children }) => {
  const [tab, setTab] = useState("all");
  const [period, setPeriod] = useState("");
  const [activityTypeKey, setActivityTypeKey] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [userId, setUserId] = useState("");
  const [activityTypeId, setActivityTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [masters, setMasters] = useState(null);
  const [summary, setSummary] = useState(defaultSummary);
  const [topUsers, setTopUsers] = useState([]);
  const [periodCounts, setPeriodCounts] = useState({});
  const [typeCounts, setTypeCounts] = useState({});
  const [summaryPeriod, setSummaryPeriod] = useState("this_week");
  const [usersPeriod, setUsersPeriod] = useState("this_month");

  const resolveActivityTypeId = useCallback(
    (key) => {
      if (!key || key === "others") return null;
      const def = ACTIVITY_TYPE_FILTERS.find((t) => t.key === key);
      return findTypeId(masters, def?.match);
    },
    [masters]
  );

  const refreshMeta = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        getActivitySummary({ period: summaryPeriod }).catch(() => null),
        getTopActiveUsers({ period: usersPeriod, limit: 5 }).catch(() => []),
      ]);
      if (s) {
        setSummary({
          total: s.total ?? 0,
          updates: s.updates ?? 0,
          assignments: s.assignments ?? 0,
          completions: s.completions ?? 0,
          comments: s.comments ?? 0,
          deletions: s.deletions ?? 0,
        });
      }
      setTopUsers(Array.isArray(u) ? u : []);
    } catch {
      /* ignore */
    }
  }, [summaryPeriod, usersPeriod]);

  const refreshFilterCounts = useCallback(async () => {
    try {
      const periodKeys = ACTIVITY_PERIODS.filter((p) => !p.custom).map((p) => p.key);
      const periodResults = await Promise.all(
        periodKeys.map((key) =>
          getActivityList({
            period: key || undefined,
            page: 1,
            pageSize: 1,
          }).catch(() => null)
        )
      );
      const pCounts = {};
      periodKeys.forEach((key, i) => {
        pCounts[key || "all"] = periodResults[i]?.totalCount ?? 0;
      });
      setPeriodCounts(pCounts);

      const typeResults = await Promise.all(
        ACTIVITY_TYPE_FILTERS.map((t) => {
          if (t.key === "others") {
            return Promise.resolve(null);
          }
          const id = findTypeId(masters, t.match);
          if (!id) return Promise.resolve(null);
          return getActivityList({
            activityTypeId: id,
            page: 1,
            pageSize: 1,
          }).catch(() => null);
        })
      );

      const tCounts = {};
      let known = 0;
      ACTIVITY_TYPE_FILTERS.forEach((t, i) => {
        if (t.key === "others") return;
        const n = typeResults[i]?.totalCount ?? 0;
        tCounts[t.key] = n;
        known += n;
      });
      const allTotal = pCounts.all ?? summary.total ?? 0;
      tCounts.others = Math.max(0, allTotal - known);
      setTypeCounts(tCounts);
    } catch {
      /* ignore */
    }
  }, [masters, summary.total]);

  useEffect(() => {
    getMasters()
      .then((m) => setMasters(m || {}))
      .catch(() => setMasters({}));
  }, []);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    if (masters) refreshFilterCounts();
  }, [masters, refreshFilterCounts]);

  const clearDropdownFilters = useCallback(() => {
    setCalendarId("");
    setUserId("");
    setActivityTypeId("");
  }, []);

  const buildActivityParams = useCallback(
    (extra = {}) => {
      const params = {
        tab,
        page: 1,
        pageSize: 10,
        ...extra,
      };
      if (period && period !== "custom") params.period = period;
      if (period === "custom") {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }
      if (calendarId) params.calendarId = calendarId;
      if (userId) params.userId = userId;

      const toolbarTypeId = activityTypeId || undefined;
      const sideTypeId = resolveActivityTypeId(activityTypeKey);
      if (toolbarTypeId) params.activityTypeId = toolbarTypeId;
      else if (sideTypeId) params.activityTypeId = sideTypeId;

      return params;
    },
    [
      tab,
      period,
      fromDate,
      toDate,
      calendarId,
      userId,
      activityTypeId,
      activityTypeKey,
      resolveActivityTypeId,
    ]
  );

  const value = useMemo(
    () => ({
      tab,
      setTab,
      period,
      setPeriod,
      activityTypeKey,
      setActivityTypeKey,
      calendarId,
      setCalendarId,
      userId,
      setUserId,
      activityTypeId,
      setActivityTypeId,
      fromDate,
      setFromDate,
      toDate,
      setToDate,
      masters,
      summary,
      topUsers,
      periodCounts,
      typeCounts,
      summaryPeriod,
      setSummaryPeriod,
      usersPeriod,
      setUsersPeriod,
      refreshMeta,
      refreshFilterCounts,
      clearDropdownFilters,
      buildActivityParams,
    }),
    [
      tab,
      period,
      activityTypeKey,
      calendarId,
      userId,
      activityTypeId,
      fromDate,
      toDate,
      masters,
      summary,
      topUsers,
      periodCounts,
      typeCounts,
      summaryPeriod,
      usersPeriod,
      refreshMeta,
      refreshFilterCounts,
      clearDropdownFilters,
      buildActivityParams,
    ]
  );

  return (
    <ActivityPageContext.Provider value={value}>{children}</ActivityPageContext.Provider>
  );
};

export const useActivityPage = () => {
  const ctx = useContext(ActivityPageContext);
  if (!ctx) throw new Error("useActivityPage must be used within ActivityPageProvider");
  return ctx;
};

export const useActivityPageOptional = () => useContext(ActivityPageContext);
