import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getMasters,
  getNotificationSettings,
  getReminderSummary,
  getRemindersList,
  updateNotificationSettings,
} from "../../../helpers/calendar_api";

export const REMINDER_TABS = [
  { key: "all", label: "All", countKey: null },
  { key: "today", label: "Today", countKey: "dueToday" },
  { key: "tomorrow", label: "Tomorrow", countKey: "tomorrow" },
  { key: "this_week", label: "This Week", countKey: "thisWeek" },
  { key: "upcoming", label: "Upcoming", countKey: null },
  { key: "missed", label: "Missed", countKey: "missed" },
  { key: "completed", label: "Completed", countKey: "completed" },
];

export const REMINDER_CHANNELS = [
  {
    key: "inappEnabled",
    label: "In-App",
    icon: "ri-notification-3-line",
    color: "#43A047",
    bg: "#E8F5E9",
  },
  {
    key: "emailEnabled",
    label: "Email",
    icon: "ri-mail-line",
    color: "#1E88E5",
    bg: "#E3F2FD",
  },
  {
    key: "smsEnabled",
    label: "SMS",
    icon: "ri-chat-3-line",
    color: "#5E35B1",
    bg: "#EDE7F6",
  },
  {
    key: "whatsappEnabled",
    label: "WhatsApp",
    icon: "ri-whatsapp-line",
    color: "#25D366",
    bg: "#E8F5E9",
  },
];

const defaultSummary = {
  total: 0,
  scheduled: 0,
  dueToday: 0,
  thisWeek: 0,
  missed: 0,
  completed: 0,
  tomorrow: 0,
};

const RemindersPageContext = createContext(null);

export const RemindersPageProvider = ({ children }) => {
  const [tab, setTab] = useState("all");
  const [summary, setSummary] = useState(defaultSummary);
  const [masters, setMasters] = useState(null);
  const [calendarId, setCalendarId] = useState("");
  const [reminderTypeId, setReminderTypeId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [channelPrefs, setChannelPrefs] = useState({
    inappEnabled: true,
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    pushEnabled: true,
    assignmentNotification: true,
    reminderNotification: true,
    approvalNotification: true,
    commentNotification: true,
    quietHourStart: null,
    quietHourEnd: null,
  });
  const [channelSaving, setChannelSaving] = useState(false);

  const refreshSummary = useCallback(async () => {
    try {
      const [data, tomorrowPage] = await Promise.all([
        getReminderSummary(),
        getRemindersList({ tab: "tomorrow", page: 1, pageSize: 1 }).catch(() => null),
      ]);
      if (data) {
        setSummary({
          total: data.total ?? 0,
          scheduled: data.scheduled ?? 0,
          dueToday: data.dueToday ?? 0,
          thisWeek: data.thisWeek ?? 0,
          missed: data.missed ?? 0,
          completed: data.completed ?? 0,
          tomorrow: tomorrowPage?.totalCount ?? data.tomorrow ?? 0,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, m, notif, tomorrowPage] = await Promise.all([
          getReminderSummary().catch(() => null),
          getMasters().catch(() => ({})),
          getNotificationSettings().catch(() => null),
          getRemindersList({ tab: "tomorrow", page: 1, pageSize: 1 }).catch(() => null),
        ]);
        if (summaryData) {
          setSummary({
            total: summaryData.total ?? 0,
            scheduled: summaryData.scheduled ?? 0,
            dueToday: summaryData.dueToday ?? 0,
            thisWeek: summaryData.thisWeek ?? 0,
            missed: summaryData.missed ?? 0,
            completed: summaryData.completed ?? 0,
            tomorrow: tomorrowPage?.totalCount ?? summaryData.tomorrow ?? 0,
          });
        }
        setMasters(m || {});
        if (notif) {
          setChannelPrefs((prev) => ({ ...prev, ...notif }));
        }
      } catch {
        setMasters({});
      }
    };
    load();
  }, []);

  const toggleChannel = useCallback(
    async (key) => {
      const prev = channelPrefs;
      const next = { ...channelPrefs, [key]: !channelPrefs[key] };
      setChannelPrefs(next);
      setChannelSaving(true);
      try {
        await updateNotificationSettings(next);
      } catch {
        setChannelPrefs(prev);
      } finally {
        setChannelSaving(false);
      }
    },
    [channelPrefs]
  );

  const clearDropdownFilters = useCallback(() => {
    setCalendarId("");
    setReminderTypeId("");
    setChannelId("");
  }, []);

  const buildReminderParams = useCallback(
    (extra = {}) => {
      const params = {
        tab,
        page: 1,
        pageSize: 10,
        ...extra,
      };
      if (calendarId) params.calendarId = calendarId;
      if (reminderTypeId) params.reminderTypeId = reminderTypeId;
      if (channelId) params.channelId = channelId;
      return params;
    },
    [tab, calendarId, reminderTypeId, channelId]
  );

  const value = useMemo(
    () => ({
      tab,
      setTab,
      summary,
      refreshSummary,
      masters,
      calendarId,
      setCalendarId,
      reminderTypeId,
      setReminderTypeId,
      channelId,
      setChannelId,
      channelPrefs,
      toggleChannel,
      channelSaving,
      clearDropdownFilters,
      buildReminderParams,
    }),
    [
      tab,
      summary,
      refreshSummary,
      masters,
      calendarId,
      reminderTypeId,
      channelId,
      channelPrefs,
      toggleChannel,
      channelSaving,
      clearDropdownFilters,
      buildReminderParams,
    ]
  );

  return (
    <RemindersPageContext.Provider value={value}>
      {children}
    </RemindersPageContext.Provider>
  );
};

export const useRemindersPage = () => {
  const ctx = useContext(RemindersPageContext);
  if (!ctx) throw new Error("useRemindersPage must be used within RemindersPageProvider");
  return ctx;
};

export const useRemindersPageOptional = () => useContext(RemindersPageContext);
