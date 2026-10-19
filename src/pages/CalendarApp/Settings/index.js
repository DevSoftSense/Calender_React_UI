import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Nav,
  NavItem,
  NavLink,
  Row,
  Spinner,
} from "reactstrap";
import classnames from "classnames";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import {
  getGeneralSettings,
  getIntegrations,
  getMasters,
  getNotificationSettings,
  getPrivacySettings,
  getTaskDefaults,
  getUserPreferences,
  updateGeneralSettings,
  updateIntegration,
  updateNotificationSettings,
  updatePrivacySettings,
  updateTaskDefaults,
  updateUserPreferences,
} from "../../../helpers/calendar_api";
import { changeLayoutMode } from "../../../slices/thunks";
import { layoutModeTypes } from "../../../Components/constants/layout";
import {
  COLOR_PALETTE,
  SETTINGS_TABS,
  useSettingsPage,
} from "./SettingsPageContext";
import "./settings.css";

const RIGHT_SECTIONS = [
  {
    title: "Account Settings",
    items: [
      {
        key: "profile",
        icon: "ri-user-line",
        title: "Your Profile",
        desc: "Manage your personal information",
        tab: "privacy",
      },
      {
        key: "password",
        icon: "ri-lock-password-line",
        title: "Change Password",
        desc: "Update your account password",
        tab: "privacy",
      },
      {
        key: "2fa",
        icon: "ri-shield-check-line",
        title: "Two-Factor Authentication",
        desc: "Add an extra layer of security",
        tab: "privacy",
        badge: "On",
        badgeColor: "success",
      },
      {
        key: "sessions",
        icon: "ri-computer-line",
        title: "Active Sessions",
        desc: "Manage your active sessions",
        tab: "privacy",
        count: 3,
      },
    ],
  },
  {
    title: "Calendar Settings",
    items: [
      {
        key: "manage-cal",
        icon: "ri-calendar-line",
        title: "Manage Calendars",
        desc: "Create, edit and manage your calendars",
        tab: "calendar",
      },
      {
        key: "permissions",
        icon: "ri-group-line",
        title: "Calendar Permissions",
        desc: "Manage calendar sharing and permissions",
        tab: "calendar",
      },
      {
        key: "holiday",
        icon: "ri-gift-line",
        title: "Holiday Calendar",
        desc: "Manage holidays for your region",
        tab: "calendar",
      },
    ],
  },
  {
    title: "Data & Customization",
    items: [
      {
        key: "fields",
        icon: "ri-list-check-2",
        title: "Custom Fields",
        desc: "Manage custom fields for items",
        tab: "other",
      },
      {
        key: "tags",
        icon: "ri-price-tag-3-line",
        title: "Tags & Categories",
        desc: "Manage tags and categories",
        tab: "other",
      },
      {
        key: "import",
        icon: "ri-download-2-line",
        title: "Import / Export",
        desc: "Import or export your data",
        tab: "other",
      },
    ],
  },
];

const NOTIFICATION_CHANNELS = [
  {
    key: "inappEnabled",
    label: "In-App Notifications",
    desc: "Show alerts inside Calendar",
    icon: "ri-notification-3-line",
    color: "#556ee6",
  },
  {
    key: "emailEnabled",
    label: "Email Notifications",
    desc: "Send updates to your email",
    icon: "ri-mail-line",
    color: "#43A047",
  },
  {
    key: "pushEnabled",
    label: "Push Notifications",
    desc: "Browser and device push alerts",
    icon: "ri-smartphone-line",
    color: "#7E57C2",
  },
  {
    key: "smsEnabled",
    label: "SMS Notifications",
    desc: "Text messages for urgent alerts",
    icon: "ri-chat-3-line",
    color: "#FB8C00",
  },
  {
    key: "whatsappEnabled",
    label: "WhatsApp Notifications",
    desc: "Alerts via WhatsApp",
    icon: "ri-whatsapp-line",
    color: "#25D366",
  },
];

const NOTIFICATION_EVENTS = [
  {
    key: "assignmentNotification",
    label: "Assignment Updates",
    desc: "When tasks are assigned or reassigned",
    icon: "ri-user-add-line",
    color: "#FB8C00",
  },
  {
    key: "reminderNotification",
    label: "Event Reminders",
    desc: "Upcoming events and due reminders",
    icon: "ri-alarm-line",
    color: "#556ee6",
  },
  {
    key: "approvalNotification",
    label: "Approvals",
    desc: "When approvals are requested or decided",
    icon: "ri-shield-check-line",
    color: "#00ACC1",
  },
  {
    key: "commentNotification",
    label: "Comments",
    desc: "New comments on your items",
    icon: "ri-chat-1-line",
    color: "#8E24AA",
  },
];

const WEEK_DAYS = [
  { key: "1", label: "Mon" },
  { key: "2", label: "Tue" },
  { key: "3", label: "Wed" },
  { key: "4", label: "Thu" },
  { key: "5", label: "Fri" },
  { key: "6", label: "Sat" },
  { key: "0", label: "Sun" },
];

const PREVIEW_EVENTS = [
  { day: 0, start: 1, span: 1, title: "Team Standup", color: "#4FC3F7" },
  { day: 1, start: 2, span: 2, title: "Project Review", color: "#7E57C2" },
  { day: 2, start: 3, span: 1, title: "Client Meeting", color: "#FB8C00" },
  { day: 3, start: 1, span: 2, title: "Design Sync", color: "#EC407A" },
  { day: 4, start: 2, span: 1, title: "Weekly Planning", color: "#556ee6" },
];

const SettingRow = ({ icon, iconColor = "#556ee6", title, desc, children }) => (
  <div className="settings-row">
    <span
      className="settings-row-icon"
      style={{ background: `${iconColor}18`, color: iconColor }}
    >
      <i className={icon} />
    </span>
    <div className="settings-row-text">
      <div className="settings-row-title">{title}</div>
      {desc ? <div className="settings-row-desc">{desc}</div> : null}
    </div>
    <div className="settings-row-control">{children}</div>
  </div>
);

const CalendarWeekPreview = () => (
  <div className="settings-cal-preview">
    <div className="settings-cal-preview-header">
      <strong>June 2025</strong>
      <span className="text-muted small">Week View</span>
    </div>
    <div className="settings-cal-preview-days">
      {["Mon 23", "Tue 24", "Wed 25", "Thu 26", "Fri 27", "Sat 28", "Sun 29"].map((d) => (
        <div key={d} className="settings-cal-preview-daylabel">
          {d}
        </div>
      ))}
    </div>
    <div className="settings-cal-preview-grid">
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 7 }).map((__, col) => {
          const ev = PREVIEW_EVENTS.find((e) => e.day === col && e.start === row + 1);
          return (
            <div key={`${row}-${col}`} className="settings-cal-preview-cell">
              {ev ? (
                <div
                  className="settings-cal-preview-event"
                  style={{
                    background: `${ev.color}22`,
                    color: ev.color,
                    borderLeft: `3px solid ${ev.color}`,
                    gridRow: `span ${ev.span}`,
                  }}
                >
                  {ev.title}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  </div>
);

const REMINDER_PREVIEW = {
  event: {
    title: "Team Standup",
    when: "Tue, 27 May 2025 • 10:00 AM - 10:30 AM",
    reminder: "15 minutes before",
    notifyTitle: "Upcoming: Team Standup",
    notifySub: "Starts in 15 minutes • 10:00 AM",
    dateLabel: "MAY",
    dateNum: "27",
  },
  task: {
    title: "Submit GST Return",
    when: "Wed, 28 May 2025 • Due 06:00 PM",
    reminder: "1 day before",
    notifyTitle: "Task due soon: Submit GST Return",
    notifySub: "Due tomorrow at 06:00 PM",
    dateLabel: "MAY",
    dateNum: "28",
  },
  allday: {
    title: "Company Holiday",
    when: "Fri, 30 May 2025 • All day",
    reminder: "1 day before",
    notifyTitle: "All-day: Company Holiday",
    notifySub: "Tomorrow • All day",
    dateLabel: "MAY",
    dateNum: "30",
  },
};

const defaultReminderPrefs = {
  snoozeDuration: 10,
  maxSnoozes: 3,
  allDayEnabled: true,
  allDayOffset: 1440,
  recurringMode: "each",
  assignedEnabled: true,
  assignedOffset: 15,
  inappEnabled: true,
  emailEnabled: true,
  pushEnabled: true,
  smsEnabled: false,
  whatsappEnabled: false,
  weekendReminders: true,
  mutePast: true,
  followTimezone: true,
  smartReminders: false,
};

const defaultTaskPrefs = {
  dueDateMode: "none",
  recurrence: "none",
  tags: ["General", "Work"],
  description: "",
  showAdditionalOptions: false,
  setReminderByDefault: true,
  autoMarkCompleted: false,
  lockCompleted: false,
  archiveCompleted: false,
};

const defaultPrivacyPrefs = {
  profileVisibility: "workspace",
  eventVisibility: "invited",
  shareAvailability: true,
  eventLinkSharing: false,
  hideDeclined: true,
  twoFactorEnabled: true,
};

const defaultOtherPrefs = {
  density: "comfortable",
  showMiniCalendar: true,
  showWeekNumbers: false,
  alertSound: "chime",
  snoozeMinutes: 10,
  openEventsIn: "popup",
  keyboardShortcuts: true,
  showTips: true,
};

const TAG_COLORS = {
  General: "#556ee6",
  Work: "#43A047",
  Personal: "#8E24AA",
  Urgent: "#E53935",
};

const CalendarSettings = () => {
  document.title = "Settings | Calendar";

  const {
    tab,
    setTab,
    selectWorkspace,
    accentColor,
    saveAccent,
    itemsPerPage,
    saveItemsPerPage,
    workspaceName,
    setWorkspaceName,
    saveWorkspaceName,
  } = useSettingsPage();

  const dispatch = useDispatch();
  const selectLayout = createSelector(
    (state) => state.Layout,
    (layout) => layout.layoutModeType
  );
  const layoutModeType = useSelector(selectLayout);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [workspaceDraft, setWorkspaceDraft] = useState(workspaceName);

  const [general, setGeneral] = useState({
    defaultCalendarId: null,
    defaultView: 3,
    languageCode: "en",
    timezoneName: "Asia/Kolkata",
    dateFormat: "DD MMM YYYY",
    timeFormat: 12,
    weekStartDay: 1,
    workingDays: "1,2,3,4,5",
    workingHourFrom: "09:00:00",
    workingHourTo: "18:00:00",
    compactView: false,
  });

  const [notifications, setNotifications] = useState({
    inappEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    pushEnabled: true,
    assignmentNotification: true,
    reminderNotification: true,
    approvalNotification: true,
    commentNotification: true,
    quietHourStart: null,
    quietHourEnd: null,
  });

  const [taskDefaults, setTaskDefaults] = useState({
    defaultPriorityId: null,
    defaultStatusId: null,
    defaultReminderValue: 15,
    defaultReminderUnit: 1,
    defaultDurationMinutes: 60,
    autoAssignMe: true,
    approvalRequired: false,
  });

  const [integrations, setIntegrations] = useState([]);
  const [masters, setMasters] = useState(null);
  const [tagInput, setTagInput] = useState("");
  const [calPrefs, setCalPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("calendarTabPrefs");
      return raw
        ? JSON.parse(raw)
        : {
            showWeekNumbers: true,
            compactWeekends: false,
            enableFocusTime: true,
            hideDeclined: false,
            showLunar: false,
          };
    } catch {
      return {
        showWeekNumbers: true,
        compactWeekends: false,
        enableFocusTime: true,
        hideDeclined: false,
        showLunar: false,
      };
    }
  });

  const [reminderPrefs, setReminderPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("reminderTabPrefs");
      return raw ? { ...defaultReminderPrefs, ...JSON.parse(raw) } : defaultReminderPrefs;
    } catch {
      return defaultReminderPrefs;
    }
  });
  const [reminderPreviewTab, setReminderPreviewTab] = useState("event");
  const [taskPrefs, setTaskPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("taskDefaultsTabPrefs");
      return raw ? { ...defaultTaskPrefs, ...JSON.parse(raw) } : defaultTaskPrefs;
    } catch {
      return defaultTaskPrefs;
    }
  });
  const [privacyPrefs, setPrivacyPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("privacySecurityPrefs");
      return raw ? { ...defaultPrivacyPrefs, ...JSON.parse(raw) } : defaultPrivacyPrefs;
    } catch {
      return defaultPrivacyPrefs;
    }
  });
  const [otherPrefs, setOtherPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("otherTabPrefs");
      return raw ? { ...defaultOtherPrefs, ...JSON.parse(raw) } : defaultOtherPrefs;
    } catch {
      return defaultOtherPrefs;
    }
  });

  const setCalPref = (key, value) => {
    setCalPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("calendarTabPrefs", JSON.stringify(next));
      return next;
    });
  };

  const setReminderPref = (key, value) => {
    setReminderPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("reminderTabPrefs", JSON.stringify(next));
      return next;
    });
  };

  const setTaskPref = (key, value) => {
    setTaskPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("taskDefaultsTabPrefs", JSON.stringify(next));
      return next;
    });
  };

  const setPrivacyPref = (key, value) => {
    setPrivacyPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("privacySecurityPrefs", JSON.stringify(next));
      return next;
    });
  };

  const setOtherPref = (key, value) => {
    setOtherPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("otherTabPrefs", JSON.stringify(next));
      return next;
    });
  };

  const workingDaySet = new Set(
    String(general.workingDays || "1,2,3,4,5")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );

  const toggleWorkingDay = (dayKey) => {
    const next = new Set(workingDaySet);
    if (next.has(dayKey)) next.delete(dayKey);
    else next.add(dayKey);
    const ordered = WEEK_DAYS.map((d) => d.key).filter((k) => next.has(k));
    setGeneral({ ...general, workingDays: ordered.join(",") || "1,2,3,4,5" });
  };

  const resetCalendarDefaults = () => {
    setGeneral((prev) => ({
      ...prev,
      defaultView: 2,
      weekStartDay: 1,
      workingHourFrom: "09:00:00",
      workingHourTo: "17:00:00",
      workingDays: "1,2,3,4,5",
    }));
    setTaskDefaults((prev) => ({
      ...prev,
      defaultDurationMinutes: 60,
      defaultReminderValue: 15,
    }));
    const defaults = {
      showWeekNumbers: true,
      compactWeekends: false,
      enableFocusTime: true,
      hideDeclined: false,
      showLunar: false,
    };
    setCalPrefs(defaults);
    localStorage.setItem("calendarTabPrefs", JSON.stringify(defaults));
  };

  const resetNotificationDefaults = () => {
    setNotifications({
      inappEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      whatsappEnabled: false,
      pushEnabled: true,
      assignmentNotification: true,
      reminderNotification: true,
      approvalNotification: true,
      commentNotification: true,
      quietHourStart: "22:00:00",
      quietHourEnd: "07:00:00",
    });
  };

  const resetReminderDefaults = () => {
    setTaskDefaults((prev) => ({
      ...prev,
      defaultReminderValue: 15,
    }));
    setNotifications((prev) => ({
      ...prev,
      reminderNotification: true,
      inappEnabled: true,
      emailEnabled: false,
      pushEnabled: true,
      smsEnabled: false,
    }));
    setReminderPrefs(defaultReminderPrefs);
    localStorage.setItem("reminderTabPrefs", JSON.stringify(defaultReminderPrefs));
  };

  const resetTaskDefaultsUi = () => {
    const statuses = masters?.statuses || [];
    const priorities = masters?.priorities || [];
    const todo = statuses.find((s) => /to\s*do|pending/i.test(s.name));
    const medium = priorities.find((p) => /medium/i.test(p.name));
    setTaskDefaults((prev) => ({
      ...prev,
      defaultStatusId: todo?.id ?? null,
      defaultPriorityId: medium?.id ?? null,
      defaultReminderValue: 15,
      defaultDurationMinutes: 60,
      autoAssignMe: true,
      approvalRequired: false,
    }));
    setTaskPrefs(defaultTaskPrefs);
    localStorage.setItem("taskDefaultsTabPrefs", JSON.stringify(defaultTaskPrefs));
  };

  const resetPrivacyDefaults = () => {
    setPrivacyPrefs(defaultPrivacyPrefs);
    localStorage.setItem("privacySecurityPrefs", JSON.stringify(defaultPrivacyPrefs));
  };

  const resetOtherDefaults = () => {
    setGeneral((prev) => ({
      ...prev,
      languageCode: "en-GB",
      dateFormat: "DD MMM YYYY",
      timeFormat: 12,
      weekStartDay: 1,
      timezoneName: "Asia/Kolkata",
      compactView: false,
    }));
    setOtherPrefs(defaultOtherPrefs);
    localStorage.setItem("otherTabPrefs", JSON.stringify(defaultOtherPrefs));
    saveAccent("blue");
    setTheme("light");
  };

  const toTimeInput = (v, fallback) => {
    if (!v) return fallback;
    const s = String(v);
    return s.length >= 5 ? s.slice(0, 5) : fallback;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [g, n, t, i, m, privacy, calPrefApi, reminderPrefApi, otherPrefApi, taskUiPrefApi] =
        await Promise.all([
          getGeneralSettings().catch(() => null),
          getNotificationSettings().catch(() => null),
          getTaskDefaults().catch(() => null),
          getIntegrations().catch(() => []),
          getMasters().catch(() => ({})),
          getPrivacySettings().catch(() => null),
          getUserPreferences("calendar").catch(() => null),
          getUserPreferences("reminders").catch(() => null),
          getUserPreferences("other").catch(() => null),
          getUserPreferences("taskUi").catch(() => null),
        ]);
      if (g) setGeneral((prev) => ({ ...prev, ...g }));
      if (n) setNotifications((prev) => ({ ...prev, ...n }));
      if (t) setTaskDefaults((prev) => ({ ...prev, ...t }));
      setIntegrations(Array.isArray(i) ? i : []);
      setMasters(m || {});
      if (privacy) {
        setPrivacyPrefs((prev) => ({ ...prev, ...privacy }));
        localStorage.setItem(
          "privacySecurityPrefs",
          JSON.stringify({ ...defaultPrivacyPrefs, ...privacy })
        );
      }
      if (calPrefApi && typeof calPrefApi === "object") {
        setCalPrefs((prev) => {
          const next = { ...prev, ...calPrefApi };
          localStorage.setItem("calendarTabPrefs", JSON.stringify(next));
          return next;
        });
      }
      if (reminderPrefApi && typeof reminderPrefApi === "object") {
        setReminderPrefs((prev) => {
          const next = { ...defaultReminderPrefs, ...prev, ...reminderPrefApi };
          localStorage.setItem("reminderTabPrefs", JSON.stringify(next));
          return next;
        });
      }
      if (otherPrefApi && typeof otherPrefApi === "object") {
        setOtherPrefs((prev) => {
          const next = { ...defaultOtherPrefs, ...prev, ...otherPrefApi };
          localStorage.setItem("otherTabPrefs", JSON.stringify(next));
          return next;
        });
      }
      if (taskUiPrefApi && typeof taskUiPrefApi === "object") {
        setTaskPrefs((prev) => {
          const next = { ...defaultTaskPrefs, ...prev, ...taskUiPrefApi };
          localStorage.setItem("taskDefaultsTabPrefs", JSON.stringify(next));
          return next;
        });
      }
    } catch (e) {
      setMessage(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setWorkspaceDraft(workspaceName);
  }, [workspaceName]);

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      if (tab === "general" || tab === "calendar" || tab === "other") {
        await updateGeneralSettings(general);
      }
      if (tab === "calendar") {
        await updateTaskDefaults(taskDefaults);
        await updateUserPreferences("calendar", calPrefs);
        localStorage.setItem("calendarTabPrefs", JSON.stringify(calPrefs));
      }
      if (tab === "notifications" || tab === "reminders") {
        await updateNotificationSettings(notifications);
      }
      if (tab === "reminders") {
        await updateUserPreferences("reminders", reminderPrefs);
        localStorage.setItem("reminderTabPrefs", JSON.stringify(reminderPrefs));
      }
      if (tab === "task-defaults" || tab === "reminders" || tab === "other") {
        await updateTaskDefaults(taskDefaults);
      }
      if (tab === "task-defaults") {
        await updateUserPreferences("taskUi", taskPrefs);
        localStorage.setItem("taskDefaultsTabPrefs", JSON.stringify(taskPrefs));
      }
      if (tab === "privacy") {
        await updatePrivacySettings(privacyPrefs);
        localStorage.setItem("privacySecurityPrefs", JSON.stringify(privacyPrefs));
      }
      if (tab === "other") {
        await updateUserPreferences("other", otherPrefs);
        localStorage.setItem("otherTabPrefs", JSON.stringify(otherPrefs));
      }
      setMessage("Settings saved.");
    } catch (e) {
      setMessage(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleIntegration = async (providerName, isEnabled) => {
    try {
      await updateIntegration({ providerName, isEnabled: !isEnabled });
      setIntegrations((prev) =>
        prev.map((x) =>
          x.providerName === providerName ? { ...x, isEnabled: !isEnabled } : x
        )
      );
    } catch (e) {
      setMessage(e.message || "Integration update failed");
    }
  };

  const themeKey =
    layoutModeType === layoutModeTypes.DARKMODE
      ? "dark"
      : layoutModeType === "system"
        ? "system"
        : "light";

  const setTheme = (key) => {
    if (key === "dark") dispatch(changeLayoutMode(layoutModeTypes.DARKMODE));
    else dispatch(changeLayoutMode(layoutModeTypes.LIGHTMODE));
  };

  if (loading) {
    return (
      <div className="page-content settings-page">
        <Container fluid>
          <div className="text-center py-5">
            <Spinner color="primary" />
          </div>
        </Container>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="page-content settings-page">
        <Container fluid>
          <div className="settings-page-header">
            <div>
              <h4 className="mb-0">Settings</h4>
              <p className="subtitle">
                Manage your preferences and configure Calendar the way you work.
              </p>
            </div>
          </div>

          <Row className="g-3">
            <Col xl={9} lg={8}>
              <Card className="settings-main-card border-0">
                <div className="settings-tabs-row">
                  <Nav tabs className="nav-tabs-custom">
                    {SETTINGS_TABS.map((t) => (
                      <NavItem key={t.key}>
                        <NavLink
                          className={classnames({ active: tab === t.key })}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setTab(t.key);
                            setMessage("");
                          }}
                        >
                          <i className={`${t.icon} me-1`} />
                          {t.label}
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                </div>

                <CardBody>
                  {tab === "general" && (
                    <>
                      <h5 className="settings-section-title">General Settings</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-building-line"
                          title="Workspace Name"
                          desc="Displayed across your organization"
                        >
                          <div className="d-flex gap-2 align-items-center">
                            <Input
                              value={workspaceDraft}
                              onChange={(e) => setWorkspaceDraft(e.target.value)}
                              className="settings-inline-input"
                            />
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => saveWorkspaceName(workspaceDraft.trim() || "My Workspace")}
                            >
                              Save
                            </Button>
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-time-zone-line"
                          title="Default Time Zone"
                          desc="Used for reminders and due times"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.timezoneName || "Asia/Kolkata"}
                            onChange={(e) =>
                              setGeneral({ ...general, timezoneName: e.target.value })
                            }
                          >
                            <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
                            <option value="UTC">(GMT+00:00) UTC</option>
                            <option value="America/New_York">(GMT-05:00) America/New_York</option>
                            <option value="Europe/London">(GMT+00:00) Europe/London</option>
                          </Input>
                        </SettingRow>

                        <SettingRow icon="ri-calendar-2-line" title="Date Format">
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.dateFormat || "DD MMM YYYY"}
                            onChange={(e) =>
                              setGeneral({ ...general, dateFormat: e.target.value })
                            }
                          >
                            <option value="DD MMM YYYY">DD MMM YYYY (25 Jun 2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </Input>
                        </SettingRow>

                        <SettingRow icon="ri-time-line" title="Time Format">
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.timeFormat ?? 12}
                            onChange={(e) =>
                              setGeneral({
                                ...general,
                                timeFormat: Number(e.target.value),
                              })
                            }
                          >
                            <option value={12}>12-Hour (02:30 PM)</option>
                            <option value={24}>24-Hour (14:30)</option>
                          </Input>
                        </SettingRow>

                        <SettingRow icon="ri-calendar-check-line" title="Week Starts On">
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.weekStartDay ?? 1}
                            onChange={(e) =>
                              setGeneral({
                                ...general,
                                weekStartDay: Number(e.target.value),
                              })
                            }
                          >
                            <option value={1}>Monday</option>
                            <option value={0}>Sunday</option>
                          </Input>
                        </SettingRow>

                        <SettingRow icon="ri-global-line" title="Language">
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.languageCode || "en"}
                            onChange={(e) =>
                              setGeneral({ ...general, languageCode: e.target.value })
                            }
                          >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="ar">Arabic</option>
                          </Input>
                        </SettingRow>
                      </div>

                      <h5 className="settings-section-title mt-4">Display Settings</h5>
                      <div className="settings-section-card">
                        <SettingRow icon="ri-palette-line" title="Theme" desc="Choose light or dark appearance">
                          <div className="settings-theme-group">
                            {[
                              { key: "light", label: "Light", icon: "ri-sun-line" },
                              { key: "dark", label: "Dark", icon: "ri-moon-line" },
                              { key: "system", label: "System", icon: "ri-computer-line" },
                            ].map((t) => (
                              <button
                                type="button"
                                key={t.key}
                                className={classnames("settings-theme-btn", {
                                  active: themeKey === t.key,
                                })}
                                onClick={() => setTheme(t.key === "system" ? "light" : t.key)}
                              >
                                <i className={t.icon} />
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </SettingRow>

                        <SettingRow icon="ri-drop-line" title="Color Palette" desc="Accent color for the app">
                          <div className="settings-color-row">
                            {COLOR_PALETTE.map((c) => (
                              <button
                                type="button"
                                key={c.key}
                                className={classnames("settings-color-swatch", {
                                  active: accentColor === c.key,
                                })}
                                style={{ background: c.color }}
                                onClick={() => saveAccent(c.key)}
                                title={c.key}
                              >
                                {accentColor === c.key ? (
                                  <i className="ri-check-line" />
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </SettingRow>

                        <SettingRow icon="ri-list-ordered" title="Items per page">
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={itemsPerPage}
                            onChange={(e) => saveItemsPerPage(Number(e.target.value))}
                          >
                            <option value={10}>10 items</option>
                            <option value={25}>25 items</option>
                            <option value={50}>50 items</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-layout-row-line"
                          title="Compact View"
                          desc="Reduce spacing in lists and tables"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!general.compactView}
                              onChange={(e) =>
                                setGeneral({
                                  ...general,
                                  compactView: e.target.checked,
                                })
                              }
                            />
                          </div>
                        </SettingRow>
                      </div>
                    </>
                  )}

                  {tab === "calendar" && (
                    <>
                      <h5 className="settings-section-title">Calendar Settings</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-layout-grid-line"
                          iconColor="#556ee6"
                          title="Default Calendar View"
                          desc="How the calendar opens by default"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.defaultView ?? 2}
                            onChange={(e) =>
                              setGeneral({
                                ...general,
                                defaultView: Number(e.target.value),
                              })
                            }
                          >
                            <option value={1}>Day View</option>
                            <option value={2}>Week View</option>
                            <option value={3}>Month View</option>
                            <option value={4}>Agenda View</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-check-line"
                          iconColor="#43A047"
                          title="Start Week On"
                          desc="First day of the week"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={general.weekStartDay ?? 1}
                            onChange={(e) =>
                              setGeneral({
                                ...general,
                                weekStartDay: Number(e.target.value),
                              })
                            }
                          >
                            <option value={1}>Monday</option>
                            <option value={0}>Sunday</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-timer-line"
                          iconColor="#FB8C00"
                          title="Default Event Duration"
                          desc="Length for new events"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskDefaults.defaultDurationMinutes ?? 60}
                            onChange={(e) =>
                              setTaskDefaults({
                                ...taskDefaults,
                                defaultDurationMinutes: Number(e.target.value),
                              })
                            }
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-hashtag"
                          iconColor="#7E57C2"
                          title="Show Week Numbers"
                          desc="Display week numbers in calendar"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!calPrefs.showWeekNumbers}
                              onChange={(e) => setCalPref("showWeekNumbers", e.target.checked)}
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-layout-column-line"
                          iconColor="#E53935"
                          title="Compact Weekends"
                          desc="Show Saturday and Sunday in a smaller column"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!calPrefs.compactWeekends}
                              onChange={(e) => setCalPref("compactWeekends", e.target.checked)}
                            />
                          </div>
                        </SettingRow>
                      </div>

                      <h5 className="settings-section-title mt-4">Working Hours</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-time-line"
                          iconColor="#556ee6"
                          title="Working Hours"
                          desc="Your typical work day"
                        >
                          <div className="d-flex gap-2 align-items-center">
                            <Input
                              type="time"
                              className="settings-inline-select"
                              value={(general.workingHourFrom || "09:00:00").slice(0, 5)}
                              onChange={(e) =>
                                setGeneral({
                                  ...general,
                                  workingHourFrom: `${e.target.value}:00`,
                                })
                              }
                            />
                            <span className="text-muted">to</span>
                            <Input
                              type="time"
                              className="settings-inline-select"
                              value={(general.workingHourTo || "17:00:00").slice(0, 5)}
                              onChange={(e) =>
                                setGeneral({
                                  ...general,
                                  workingHourTo: `${e.target.value}:00`,
                                })
                              }
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-event-line"
                          iconColor="#43A047"
                          title="Working Days"
                          desc="Days included in your work week"
                        >
                          <div className="settings-day-chips">
                            {WEEK_DAYS.map((d) => (
                              <button
                                type="button"
                                key={d.key}
                                className={classnames("settings-day-chip", {
                                  active: workingDaySet.has(d.key),
                                })}
                                onClick={() => toggleWorkingDay(d.key)}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-alarm-line"
                          iconColor="#FB8C00"
                          title="Default Event Reminder"
                          desc="Remind before events start"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskDefaults.defaultReminderValue ?? 15}
                            onChange={(e) =>
                              setTaskDefaults({
                                ...taskDefaults,
                                defaultReminderValue: Number(e.target.value),
                              })
                            }
                          >
                            <option value={5}>5 minutes before</option>
                            <option value={15}>15 minutes before</option>
                            <option value={30}>30 minutes before</option>
                            <option value={60}>1 hour before</option>
                            <option value={1440}>1 day before</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-focus-3-line"
                          iconColor="#7E57C2"
                          title="Enable Focus Time"
                          desc="Block time for deep work on your calendar"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!calPrefs.enableFocusTime}
                              onChange={(e) => setCalPref("enableFocusTime", e.target.checked)}
                            />
                          </div>
                        </SettingRow>
                      </div>
                    </>
                  )}

                  {tab === "notifications" && (
                    <>
                      <h5 className="settings-section-title">Delivery Channels</h5>
                      <div className="settings-section-card">
                        {NOTIFICATION_CHANNELS.map((item) => (
                          <SettingRow
                            key={item.key}
                            icon={item.icon}
                            iconColor={item.color}
                            title={item.label}
                            desc={item.desc}
                          >
                            <div className="form-check form-switch mb-0">
                              <Input
                                type="switch"
                                checked={!!notifications[item.key]}
                                onChange={(e) =>
                                  setNotifications({
                                    ...notifications,
                                    [item.key]: e.target.checked,
                                  })
                                }
                              />
                            </div>
                          </SettingRow>
                        ))}
                      </div>

                      <h5 className="settings-section-title mt-4">Notify Me About</h5>
                      <div className="settings-section-card">
                        {NOTIFICATION_EVENTS.map((item) => (
                          <SettingRow
                            key={item.key}
                            icon={item.icon}
                            iconColor={item.color}
                            title={item.label}
                            desc={item.desc}
                          >
                            <div className="form-check form-switch mb-0">
                              <Input
                                type="switch"
                                checked={!!notifications[item.key]}
                                onChange={(e) =>
                                  setNotifications({
                                    ...notifications,
                                    [item.key]: e.target.checked,
                                  })
                                }
                              />
                            </div>
                          </SettingRow>
                        ))}
                      </div>

                      <h5 className="settings-section-title mt-4">Quiet Hours</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-moon-line"
                          iconColor="#5E35B1"
                          title="Do Not Disturb"
                          desc="Pause non-urgent alerts during quiet hours"
                        >
                          <div className="d-flex gap-2 align-items-center">
                            <Input
                              type="time"
                              className="settings-inline-select"
                              value={toTimeInput(notifications.quietHourStart, "22:00")}
                              onChange={(e) =>
                                setNotifications({
                                  ...notifications,
                                  quietHourStart: `${e.target.value}:00`,
                                })
                              }
                            />
                            <span className="text-muted">to</span>
                            <Input
                              type="time"
                              className="settings-inline-select"
                              value={toTimeInput(notifications.quietHourEnd, "07:00")}
                              onChange={(e) =>
                                setNotifications({
                                  ...notifications,
                                  quietHourEnd: `${e.target.value}:00`,
                                })
                              }
                            />
                          </div>
                        </SettingRow>
                      </div>
                    </>
                  )}

                  {tab === "reminders" && (
                    <>
                      <h5 className="settings-section-title">Reminder Preferences</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-time-line"
                          iconColor="#556ee6"
                          title="Default Reminder Times"
                          desc="Applied when creating new events"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskDefaults.defaultReminderValue ?? 15}
                            onChange={(e) =>
                              setTaskDefaults({
                                ...taskDefaults,
                                defaultReminderValue: Number(e.target.value),
                              })
                            }
                          >
                            <option value={5}>5 minutes before</option>
                            <option value={15}>15 minutes before</option>
                            <option value={30}>30 minutes before</option>
                            <option value={60}>1 hour before</option>
                            <option value={1440}>1 day before</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-alarm-snooze-line"
                          iconColor="#43A047"
                          title="Snooze Duration"
                          desc="How long to snooze a reminder"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={reminderPrefs.snoozeDuration}
                            onChange={(e) =>
                              setReminderPref("snoozeDuration", Number(e.target.value))
                            }
                          >
                            <option value={5}>5 minutes</option>
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-refresh-line"
                          iconColor="#7E57C2"
                          title="Maximum Snoozes"
                          desc="Limit how many times you can snooze"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={reminderPrefs.maxSnoozes}
                            onChange={(e) =>
                              setReminderPref("maxSnoozes", Number(e.target.value))
                            }
                          >
                            <option value={1}>1 time</option>
                            <option value={2}>2 times</option>
                            <option value={3}>3 times</option>
                            <option value={5}>5 times</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-event-line"
                          iconColor="#FB8C00"
                          title="All Day Event Reminder"
                          desc="Reminders for all-day events"
                        >
                          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                            <div className="form-check form-switch mb-0">
                              <Input
                                type="switch"
                                checked={!!reminderPrefs.allDayEnabled}
                                onChange={(e) =>
                                  setReminderPref("allDayEnabled", e.target.checked)
                                }
                              />
                            </div>
                            <Input
                              type="select"
                              className="settings-inline-select"
                              disabled={!reminderPrefs.allDayEnabled}
                              value={reminderPrefs.allDayOffset}
                              onChange={(e) =>
                                setReminderPref("allDayOffset", Number(e.target.value))
                              }
                            >
                              <option value={0}>On the day</option>
                              <option value={1440}>1 day before</option>
                              <option value={2880}>2 days before</option>
                            </Input>
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-repeat-line"
                          iconColor="#1E88E5"
                          title="Recurring Events Reminder"
                          desc="How reminders work for recurring events"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={reminderPrefs.recurringMode}
                            onChange={(e) => setReminderPref("recurringMode", e.target.value)}
                          >
                            <option value="each">Each Occurrence</option>
                            <option value="first">First Occurrence Only</option>
                            <option value="none">No Reminder</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-user-shared-line"
                          iconColor="#43A047"
                          title="Assigned Task Reminder"
                          desc="Reminders for tasks assigned to you"
                        >
                          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                            <div className="form-check form-switch mb-0">
                              <Input
                                type="switch"
                                checked={!!reminderPrefs.assignedEnabled}
                                onChange={(e) =>
                                  setReminderPref("assignedEnabled", e.target.checked)
                                }
                              />
                            </div>
                            <Input
                              type="select"
                              className="settings-inline-select"
                              disabled={!reminderPrefs.assignedEnabled}
                              value={reminderPrefs.assignedOffset}
                              onChange={(e) =>
                                setReminderPref("assignedOffset", Number(e.target.value))
                              }
                            >
                              <option value={15}>15 minutes before</option>
                              <option value={30}>30 minutes before</option>
                              <option value={60}>1 hour before</option>
                              <option value={1440}>1 day before</option>
                            </Input>
                          </div>
                        </SettingRow>
                      </div>

                      <h5 className="settings-section-title mt-4">Reminder Channels</h5>
                      <div className="settings-channel-grid">
                        {[
                          {
                            key: "inappEnabled",
                            label: "In-App",
                            desc: "Show reminders inside Calendar",
                            icon: "ri-notification-3-line",
                            color: "#556ee6",
                          },
                          {
                            key: "emailEnabled",
                            label: "Email",
                            desc: "pratik.shah@gmail.com",
                            link: "Manage Email",
                            icon: "ri-mail-line",
                            color: "#7E57C2",
                          },
                          {
                            key: "pushEnabled",
                            label: "Push Notifications",
                            desc: "Browser and device alerts",
                            link: "Manage Devices",
                            icon: "ri-smartphone-line",
                            color: "#43A047",
                          },
                          {
                            key: "smsEnabled",
                            label: "SMS",
                            desc: "+91 98765 43210",
                            link: "Manage Number",
                            icon: "ri-chat-3-line",
                            color: "#FB8C00",
                          },
                        ].map((ch) => (
                          <div className="settings-channel-card" key={ch.key}>
                            <div className="d-flex align-items-start gap-2">
                              <span
                                className="settings-row-icon"
                                style={{ background: `${ch.color}18`, color: ch.color }}
                              >
                                <i className={ch.icon} />
                              </span>
                              <div className="flex-grow-1 min-w-0">
                                <div className="settings-row-title">{ch.label}</div>
                                <div className="settings-row-desc">{ch.desc}</div>
                                {ch.link ? (
                                  <button type="button" className="btn btn-link btn-sm p-0 mt-1">
                                    {ch.link}
                                  </button>
                                ) : null}
                              </div>
                              <div className="form-check form-switch mb-0">
                                <Input
                                  type="switch"
                                  checked={!!notifications[ch.key]}
                                  onChange={(e) =>
                                    setNotifications({
                                      ...notifications,
                                      [ch.key]: e.target.checked,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {tab === "task-defaults" && (
                    <>
                      <h5 className="settings-section-title">Task Default Settings</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-checkbox-blank-circle-fill"
                          iconColor="#556ee6"
                          title="Default Task Status"
                          desc="Status applied to new tasks"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskDefaults.defaultStatusId ?? ""}
                            onChange={(e) =>
                              setTaskDefaults({
                                ...taskDefaults,
                                defaultStatusId: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                          >
                            <option value="">To Do</option>
                            {(masters?.statuses || []).map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-flag-2-fill"
                          iconColor="#FB8C00"
                          title="Default Priority"
                          desc="Priority for newly created tasks"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskDefaults.defaultPriorityId ?? ""}
                            onChange={(e) =>
                              setTaskDefaults({
                                ...taskDefaults,
                                defaultPriorityId: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              })
                            }
                          >
                            <option value="">Medium</option>
                            {(masters?.priorities || []).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-user-line"
                          iconColor="#7E57C2"
                          title="Default Assignee"
                          desc="Who new tasks are assigned to"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskDefaults.autoAssignMe ? "me" : "none"}
                            onChange={(e) =>
                              setTaskDefaults({
                                ...taskDefaults,
                                autoAssignMe: e.target.value === "me",
                              })
                            }
                          >
                            <option value="none">Unassigned</option>
                            <option value="me">Assign to me</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-line"
                          iconColor="#556ee6"
                          title="Default Due Date"
                          desc="Due date rule for new tasks"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskPrefs.dueDateMode}
                            onChange={(e) => setTaskPref("dueDateMode", e.target.value)}
                          >
                            <option value="none">No Due Date</option>
                            <option value="today">Today</option>
                            <option value="tomorrow">Tomorrow</option>
                            <option value="week">In 1 week</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-repeat-line"
                          iconColor="#43A047"
                          title="Default Recurrence"
                          desc="Repeat rule for new tasks"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select"
                            value={taskPrefs.recurrence}
                            onChange={(e) => setTaskPref("recurrence", e.target.value)}
                          >
                            <option value="none">Does not repeat</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-price-tag-3-line"
                          iconColor="#8E24AA"
                          title="Default Tags"
                          desc="Tags added to new tasks"
                        >
                          <div className="settings-tags-wrap">
                            {(taskPrefs.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="settings-tag-chip"
                                style={{
                                  background: `${TAG_COLORS[tag] || "#556ee6"}18`,
                                  color: TAG_COLORS[tag] || "#556ee6",
                                }}
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTaskPref(
                                      "tags",
                                      (taskPrefs.tags || []).filter((t) => t !== tag)
                                    )
                                  }
                                >
                                  <i className="ri-close-line" />
                                </button>
                              </span>
                            ))}
                            <Input
                              bsSize="sm"
                              className="settings-tag-input"
                              placeholder="Add tag"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const v = tagInput.trim();
                                  if (v && !(taskPrefs.tags || []).includes(v)) {
                                    setTaskPref("tags", [...(taskPrefs.tags || []), v]);
                                  }
                                  setTagInput("");
                                }
                              }}
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-text"
                          iconColor="#FB8C00"
                          title="Default Description"
                          desc="Pre-filled description text"
                        >
                          <div className="settings-desc-wrap">
                            <Input
                              type="textarea"
                              rows={3}
                              maxLength={500}
                              placeholder="Add task description here..."
                              value={taskPrefs.description}
                              onChange={(e) => setTaskPref("description", e.target.value)}
                            />
                            <div className="settings-desc-count">
                              {(taskPrefs.description || "").length} / 500
                            </div>
                          </div>
                        </SettingRow>
                      </div>

                      <h5 className="settings-section-title mt-4">Task Creation Defaults</h5>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-more-2-line"
                          iconColor="#556ee6"
                          title="Show Additional Options"
                          desc="Show more task options by default while creating"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!taskPrefs.showAdditionalOptions}
                              onChange={(e) =>
                                setTaskPref("showAdditionalOptions", e.target.checked)
                              }
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-alarm-line"
                          iconColor="#FB8C00"
                          title="Set Reminder by Default"
                          desc="Set a default reminder when creating tasks"
                        >
                          <div className="d-flex align-items-center gap-2 flex-wrap justify-content-end">
                            <div className="form-check form-switch mb-0">
                              <Input
                                type="switch"
                                checked={!!taskPrefs.setReminderByDefault}
                                onChange={(e) =>
                                  setTaskPref("setReminderByDefault", e.target.checked)
                                }
                              />
                            </div>
                            <Input
                              type="select"
                              className="settings-inline-select"
                              disabled={!taskPrefs.setReminderByDefault}
                              value={taskDefaults.defaultReminderValue ?? 15}
                              onChange={(e) =>
                                setTaskDefaults({
                                  ...taskDefaults,
                                  defaultReminderValue: Number(e.target.value),
                                })
                              }
                            >
                              <option value={5}>5 minutes before</option>
                              <option value={15}>15 minutes before</option>
                              <option value={30}>30 minutes before</option>
                              <option value={60}>1 hour before</option>
                            </Input>
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-task-line"
                          iconColor="#43A047"
                          title="Add to My Tasks"
                          desc="Add newly created tasks to 'My Tasks' by default"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!taskDefaults.autoAssignMe}
                              onChange={(e) =>
                                setTaskDefaults({
                                  ...taskDefaults,
                                  autoAssignMe: e.target.checked,
                                })
                              }
                            />
                          </div>
                        </SettingRow>
                      </div>
                    </>
                  )}

                  {tab === "privacy" && (
                    <>
                      <h5 className="settings-section-title">Privacy Settings</h5>
                      <p className="settings-section-desc">
                        Control who can see your information and how your data is used.
                      </p>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-eye-line"
                          iconColor="#556ee6"
                          title="Profile Visibility"
                          desc="Choose who can view your profile information."
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={privacyPrefs.profileVisibility}
                            onChange={(e) =>
                              setPrivacyPref("profileVisibility", e.target.value)
                            }
                          >
                            <option value="workspace">Only people in my workspace</option>
                            <option value="team">Only my team</option>
                            <option value="anyone">Anyone with the link</option>
                            <option value="private">Only me</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-global-line"
                          iconColor="#43A047"
                          title="Event Visibility"
                          desc="Control default visibility for events you create."
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={privacyPrefs.eventVisibility}
                            onChange={(e) =>
                              setPrivacyPref("eventVisibility", e.target.value)
                            }
                          >
                            <option value="invited">Only invited people</option>
                            <option value="workspace">Everyone in my workspace</option>
                            <option value="public">Public</option>
                            <option value="private">Only me</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-check-line"
                          iconColor="#7E57C2"
                          title="Share Availability"
                          desc="Allow others to see your free/busy availability."
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!privacyPrefs.shareAvailability}
                              onChange={(e) =>
                                setPrivacyPref("shareAvailability", e.target.checked)
                              }
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-link"
                          iconColor="#FB8C00"
                          title="Event Link Sharing"
                          desc="Allow event link sharing with people outside your workspace."
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!privacyPrefs.eventLinkSharing}
                              onChange={(e) =>
                                setPrivacyPref("eventLinkSharing", e.target.checked)
                              }
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-forbid-line"
                          iconColor="#E53935"
                          title="Hide Declined Events"
                          desc="Hide events you've declined from your calendar."
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!privacyPrefs.hideDeclined}
                              onChange={(e) =>
                                setPrivacyPref("hideDeclined", e.target.checked)
                              }
                            />
                          </div>
                        </SettingRow>
                      </div>

                      <h5 className="settings-section-title mt-4">Data & Security</h5>
                      <p className="settings-section-desc">
                        Manage how your data is protected and used.
                      </p>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-shield-check-line"
                          iconColor="#556ee6"
                          title="Two-Factor Authentication (2FA)"
                          desc="Add an extra layer of security to your account."
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span
                              className={classnames("settings-status-text", {
                                enabled: !!privacyPrefs.twoFactorEnabled,
                              })}
                            >
                              {privacyPrefs.twoFactorEnabled ? "Enabled" : "Disabled"}
                            </span>
                            <button type="button" className="btn btn-link btn-sm p-0">
                              Manage
                            </button>
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-computer-line"
                          iconColor="#1E88E5"
                          title="Active Sessions"
                          desc="View and manage your active sessions."
                        >
                          <button type="button" className="btn btn-link btn-sm p-0">
                            View Sessions
                          </button>
                        </SettingRow>

                        <SettingRow
                          icon="ri-history-line"
                          iconColor="#7E57C2"
                          title="Login History"
                          desc="See recent login activity on your account."
                        >
                          <button type="button" className="btn btn-link btn-sm p-0">
                            View History
                          </button>
                        </SettingRow>

                        <SettingRow
                          icon="ri-key-2-line"
                          iconColor="#FB8C00"
                          title="App Passwords"
                          desc="Create and manage app-specific passwords."
                        >
                          <button type="button" className="btn btn-link btn-sm p-0">
                            Manage
                          </button>
                        </SettingRow>

                        <SettingRow
                          icon="ri-smartphone-line"
                          iconColor="#8E24AA"
                          title="Devices"
                          desc="Manage devices that have access to your account."
                        >
                          <button type="button" className="btn btn-link btn-sm p-0">
                            Manage Devices
                          </button>
                        </SettingRow>
                      </div>
                    </>
                  )}

                  {tab === "other" && (
                    <>
                      <h5 className="settings-section-title">Localization</h5>
                      <p className="settings-section-desc">
                        Customize language, time and regional preferences.
                      </p>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-global-line"
                          iconColor="#556ee6"
                          title="Language"
                          desc="Preferred language for the interface"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={
                              general.languageCode === "en"
                                ? "en-GB"
                                : general.languageCode || "en-GB"
                            }
                            onChange={(e) =>
                              setGeneral({ ...general, languageCode: e.target.value })
                            }
                          >
                            <option value="en-GB">English (UK)</option>
                            <option value="en-US">English (US)</option>
                            <option value="hi">Hindi</option>
                            <option value="ar">Arabic</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-2-line"
                          iconColor="#43A047"
                          title="Date Format"
                          desc="How dates appear across Calendar"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={general.dateFormat || "DD MMM YYYY"}
                            onChange={(e) =>
                              setGeneral({ ...general, dateFormat: e.target.value })
                            }
                          >
                            <option value="DD MMM YYYY">DD MMM YYYY (27 May 2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-time-line"
                          iconColor="#FB8C00"
                          title="Time Format"
                          desc="12-hour or 24-hour clock"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={general.timeFormat ?? 12}
                            onChange={(e) =>
                              setGeneral({
                                ...general,
                                timeFormat: Number(e.target.value),
                              })
                            }
                          >
                            <option value={12}>12-Hour (AM/PM)</option>
                            <option value={24}>24-Hour</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-check-line"
                          iconColor="#7E57C2"
                          title="Week Starts On"
                          desc="First day of the week"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={general.weekStartDay ?? 1}
                            onChange={(e) =>
                              setGeneral({
                                ...general,
                                weekStartDay: Number(e.target.value),
                              })
                            }
                          >
                            <option value={1}>Monday</option>
                            <option value={0}>Sunday</option>
                            <option value={6}>Saturday</option>
                          </Input>
                        </SettingRow>

                        <SettingRow
                          icon="ri-time-zone-line"
                          iconColor="#1E88E5"
                          title="Time Zone"
                          desc="Used for events, reminders and due times"
                        >
                          <Input
                            type="select"
                            className="settings-inline-select settings-inline-select-wide"
                            value={general.timezoneName || "Asia/Kolkata"}
                            onChange={(e) =>
                              setGeneral({ ...general, timezoneName: e.target.value })
                            }
                          >
                            <option value="Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
                            <option value="UTC">(GMT+00:00) UTC</option>
                            <option value="America/New_York">(GMT-05:00) America/New_York</option>
                            <option value="Europe/London">(GMT+00:00) Europe/London</option>
                            <option value="Asia/Dubai">(GMT+04:00) Asia/Dubai</option>
                          </Input>
                        </SettingRow>
                      </div>

                      <h5 className="settings-section-title mt-4">Display & Appearance</h5>
                      <p className="settings-section-desc">
                        Manage how Calendar looks and feels.
                      </p>
                      <div className="settings-section-card">
                        <SettingRow
                          icon="ri-palette-line"
                          iconColor="#556ee6"
                          title="Theme"
                          desc="Choose light, dark or system appearance"
                        >
                          <div className="settings-theme-group">
                            {[
                              { key: "light", label: "Light", icon: "ri-sun-line" },
                              { key: "dark", label: "Dark", icon: "ri-moon-line" },
                              { key: "system", label: "System", icon: "ri-computer-line" },
                            ].map((t) => (
                              <button
                                type="button"
                                key={t.key}
                                className={classnames("settings-theme-btn", {
                                  active: themeKey === t.key,
                                })}
                                onClick={() => setTheme(t.key === "system" ? "light" : t.key)}
                              >
                                <i className={t.icon} />
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-drop-line"
                          iconColor="#EC407A"
                          title="Accent Color"
                          desc="Primary accent used across the app"
                        >
                          <div className="settings-color-row">
                            {COLOR_PALETTE.map((c) => (
                              <button
                                type="button"
                                key={c.key}
                                className={classnames("settings-color-swatch", {
                                  active: accentColor === c.key,
                                })}
                                style={{ background: c.color }}
                                onClick={() => saveAccent(c.key)}
                                title={c.key}
                              >
                                {accentColor === c.key ? (
                                  <i className="ri-check-line" />
                                ) : null}
                              </button>
                            ))}
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-layout-row-line"
                          iconColor="#FB8C00"
                          title="Density"
                          desc="Spacing for lists and calendar views"
                        >
                          <div className="settings-theme-group">
                            {[
                              { key: "comfortable", label: "Comfortable" },
                              { key: "compact", label: "Compact" },
                              { key: "spacious", label: "Spacious" },
                            ].map((d) => (
                              <button
                                type="button"
                                key={d.key}
                                className={classnames("settings-theme-btn", {
                                  active: otherPrefs.density === d.key,
                                })}
                                onClick={() => {
                                  setOtherPref("density", d.key);
                                  setGeneral({
                                    ...general,
                                    compactView: d.key === "compact",
                                  });
                                }}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-calendar-event-line"
                          iconColor="#43A047"
                          title="Show Mini Calendar"
                          desc="Display the mini calendar in the sidebar"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!otherPrefs.showMiniCalendar}
                              onChange={(e) =>
                                setOtherPref("showMiniCalendar", e.target.checked)
                              }
                            />
                          </div>
                        </SettingRow>

                        <SettingRow
                          icon="ri-hashtag"
                          iconColor="#7E57C2"
                          title="Show Week Numbers"
                          desc="Show week numbers in calendar views"
                        >
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!otherPrefs.showWeekNumbers}
                              onChange={(e) =>
                                setOtherPref("showWeekNumbers", e.target.checked)
                              }
                            />
                          </div>
                        </SettingRow>
                      </div>
                    </>
                  )}

                  <div
                      className={classnames("d-flex gap-2 mt-4", {
                        "justify-content-end":
                          tab === "calendar" ||
                          tab === "notifications" ||
                          tab === "reminders" ||
                          tab === "task-defaults" ||
                          tab === "privacy",
                        "justify-content-between": tab === "other",
                      })}
                    >
                      <Button
                        color="light"
                        onClick={
                          tab === "calendar"
                            ? resetCalendarDefaults
                            : tab === "notifications"
                              ? resetNotificationDefaults
                              : tab === "reminders"
                                ? resetReminderDefaults
                                : tab === "task-defaults"
                                  ? resetTaskDefaultsUi
                                  : tab === "privacy"
                                    ? resetPrivacyDefaults
                                    : tab === "other"
                                      ? resetOtherDefaults
                                      : load
                        }
                        disabled={saving}
                      >
                        {tab === "calendar" ||
                        tab === "notifications" ||
                        tab === "reminders" ||
                        tab === "task-defaults" ||
                        tab === "privacy" ||
                        tab === "other"
                          ? "Reset to Defaults"
                          : "Reset"}
                      </Button>
                      <Button color="primary" onClick={save} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>

                  {message ? (
                    <div className="alert alert-info mt-3 mb-0">{message}</div>
                  ) : null}
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} lg={4} className="settings-right-col d-none d-xl-block">
              {tab === "calendar" ? (
                <>
                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Calendar Preview</h5>
                      <CalendarWeekPreview />
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Calendar Integrations</h5>
                      {[
                        {
                          key: "Google",
                          name: "Google Calendar",
                          email: "pratik@gmail.com",
                          icon: "ri-google-fill",
                          color: "#EA4335",
                        },
                        {
                          key: "Outlook",
                          name: "Outlook Calendar",
                          email: "pratik@outlook.com",
                          icon: "ri-microsoft-fill",
                          color: "#0078D4",
                        },
                        {
                          key: "Apple",
                          name: "Apple Calendar (iCloud)",
                          email: "pratik@icloud.com",
                          icon: "ri-apple-fill",
                          color: "#111111",
                        },
                      ].map((p) => {
                        const connected = integrations.some(
                          (i) =>
                            String(i.providerName || "")
                              .toLowerCase()
                              .includes(p.key.toLowerCase()) && i.isEnabled
                        );
                        const fallbackConnected = p.key !== "Apple";
                        const isOn = integrations.length
                          ? connected
                          : fallbackConnected;
                        return (
                          <div className="settings-integration-row" key={p.key}>
                            <span
                              className="settings-integration-icon"
                              style={{ color: p.color }}
                            >
                              <i className={p.icon} />
                            </span>
                            <div className="flex-grow-1 min-w-0">
                              <div className="settings-right-title">{p.name}</div>
                              <div className="settings-right-desc">{p.email}</div>
                            </div>
                            {isOn ? (
                              <span className="settings-on-badge">Connected</span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0"
                                onClick={() =>
                                  toggleIntegration(p.key, false)
                                }
                              >
                                Connect
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Other Options</h5>
                      <div className="settings-other-option">
                        <div>
                          <div className="settings-right-title">Hide Declined Events</div>
                          <div className="settings-right-desc">
                            Hide events you declined from the calendar
                          </div>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <Input
                            type="switch"
                            checked={!!calPrefs.hideDeclined}
                            onChange={(e) => setCalPref("hideDeclined", e.target.checked)}
                          />
                        </div>
                      </div>
                      <div className="settings-other-option">
                        <div>
                          <div className="settings-right-title">Show Lunar Calendar</div>
                          <div className="settings-right-desc">
                            Display lunar dates alongside Gregorian
                          </div>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <Input
                            type="switch"
                            checked={!!calPrefs.showLunar}
                            onChange={(e) => setCalPref("showLunar", e.target.checked)}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </>
              ) : tab === "notifications" ? (
                <>
                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Channel Status</h5>
                      <div className="settings-notif-summary">
                        {NOTIFICATION_CHANNELS.map((ch) => (
                          <div className="settings-notif-summary-row" key={ch.key}>
                            <span
                              className="settings-notif-dot"
                              style={{ background: ch.color }}
                            />
                            <span className="flex-grow-1">{ch.label.replace(" Notifications", "")}</span>
                            <span
                              className={classnames("settings-notif-status", {
                                on: !!notifications[ch.key],
                              })}
                            >
                              {notifications[ch.key] ? "On" : "Off"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Quiet Hours</h5>
                      <div className="settings-quiet-card">
                        <i className="ri-moon-clear-line" />
                        <div>
                          <div className="settings-right-title">Do Not Disturb</div>
                          <div className="settings-right-desc">
                            {toTimeInput(notifications.quietHourStart, "22:00")} –{" "}
                            {toTimeInput(notifications.quietHourEnd, "07:00")}
                          </div>
                        </div>
                      </div>
                      <p className="text-muted small mb-0 mt-2">
                        Non-urgent alerts are paused during this window.
                      </p>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Activity Alerts</h5>
                      {NOTIFICATION_EVENTS.map((ev) => (
                        <div className="settings-other-option" key={ev.key}>
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="settings-integration-icon"
                              style={{ color: ev.color }}
                            >
                              <i className={ev.icon} />
                            </span>
                            <div>
                              <div className="settings-right-title">{ev.label}</div>
                              <div className="settings-right-desc">
                                {notifications[ev.key] ? "Enabled" : "Disabled"}
                              </div>
                            </div>
                          </div>
                          <span
                            className={classnames("settings-notif-status", {
                              on: !!notifications[ev.key],
                            })}
                          >
                            {notifications[ev.key] ? "On" : "Off"}
                          </span>
                        </div>
                      ))}
                    </CardBody>
                  </Card>
                </>
              ) : tab === "reminders" ? (
                <>
                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title mb-1">Reminder Preview</h5>
                      <p className="text-muted small mb-3">
                        This is how your reminders will look.
                      </p>
                      <div className="settings-preview-tabs">
                        {[
                          { key: "event", label: "Event" },
                          { key: "task", label: "Task" },
                          { key: "allday", label: "All Day Event" },
                        ].map((t) => (
                          <button
                            type="button"
                            key={t.key}
                            className={classnames("settings-preview-tab", {
                              active: reminderPreviewTab === t.key,
                            })}
                            onClick={() => setReminderPreviewTab(t.key)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      {(() => {
                        const p = REMINDER_PREVIEW[reminderPreviewTab];
                        return (
                          <>
                            <div className="settings-reminder-event-card">
                              <div className="fw-semibold">{p.title}</div>
                              <div className="text-muted small">{p.when}</div>
                              <div className="settings-reminder-meta">
                                Reminder:{" "}
                                {reminderPreviewTab === "event"
                                  ? `${taskDefaults.defaultReminderValue ?? 15} minutes before`
                                  : p.reminder}
                              </div>
                            </div>
                            <div className="settings-reminder-toast">
                              <div className="settings-reminder-toast-icon">
                                <i className="ri-calendar-check-fill" />
                              </div>
                              <div className="flex-grow-1 min-w-0">
                                <div className="small text-muted">Calendar</div>
                                <div className="fw-semibold text-truncate">{p.notifyTitle}</div>
                                <div className="small text-muted">{p.notifySub}</div>
                              </div>
                              <div className="settings-reminder-datebadge">
                                <span>{p.dateLabel}</span>
                                <strong>{p.dateNum}</strong>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Advanced Options</h5>
                      {[
                        {
                          key: "weekendReminders",
                          label: "Weekend Reminders",
                          desc: "Send reminders on Saturday and Sunday",
                          icon: "ri-calendar-line",
                          color: "#556ee6",
                        },
                        {
                          key: "mutePast",
                          label: "Mute Past Reminders",
                          desc: "Skip alerts for already-passed times",
                          icon: "ri-notification-off-line",
                          color: "#E53935",
                        },
                        {
                          key: "followTimezone",
                          label: "Follow Calendar Time Zone",
                          desc: "Use calendar timezone for reminder delivery",
                          icon: "ri-time-zone-line",
                          color: "#43A047",
                        },
                        {
                          key: "smartReminders",
                          label: "Smart Reminders (AI)",
                          desc: "Suggest better reminder times",
                          icon: "ri-sparkling-line",
                          color: "#7E57C2",
                          badge: "New",
                        },
                      ].map((opt) => (
                        <div className="settings-other-option" key={opt.key}>
                          <div className="d-flex align-items-center gap-2 min-w-0">
                            <span
                              className="settings-integration-icon"
                              style={{ color: opt.color }}
                            >
                              <i className={opt.icon} />
                            </span>
                            <div className="min-w-0">
                              <div className="settings-right-title d-flex align-items-center gap-1">
                                {opt.label}
                                {opt.badge ? (
                                  <span className="settings-new-badge">{opt.badge}</span>
                                ) : null}
                              </div>
                              <div className="settings-right-desc">{opt.desc}</div>
                            </div>
                          </div>
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!reminderPrefs[opt.key]}
                              onChange={(e) => setReminderPref(opt.key, e.target.checked)}
                            />
                          </div>
                        </div>
                      ))}
                    </CardBody>
                  </Card>

                  <div className="settings-tz-banner">
                    Reminders are based on your time zone:{" "}
                    <strong>({general.timezoneName || "Asia/Kolkata"})</strong>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 ms-1"
                      onClick={() => setTab("general")}
                    >
                      Change Time Zone
                    </button>
                  </div>
                </>
              ) : tab === "privacy" ? (
                <>
                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Security Strength</h5>
                      <p className="settings-section-desc mb-3">
                        Here&apos;s how secure your account is.
                      </p>
                      <div className="settings-strength-gauge">
                        <div className="settings-strength-ring">
                          <span className="settings-strength-label">Strong</span>
                          <i className="ri-checkbox-circle-fill" />
                        </div>
                      </div>
                      <p className="text-center text-muted small mb-3">
                        Great! Your account is well protected.
                      </p>
                      <ul className="settings-strength-list">
                        {[
                          "Two-factor authentication is enabled",
                          "Recovery email is set",
                          "Strong password is set",
                          "No suspicious activity detected",
                        ].map((item) => (
                          <li key={item}>
                            <i className="ri-checkbox-circle-fill" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Privacy Shortcuts</h5>
                      {[
                        {
                          key: "blocked",
                          title: "Manage Blocked Users",
                          desc: "View and manage blocked users.",
                          icon: "ri-user-unfollow-line",
                          color: "#878a99",
                        },
                        {
                          key: "permissions",
                          title: "Manage Event Permissions",
                          desc: "Control permissions for shared events.",
                          icon: "ri-shield-check-line",
                          color: "#556ee6",
                        },
                        {
                          key: "export",
                          title: "Export My Data",
                          desc: "Download a copy of your data.",
                          icon: "ri-download-2-line",
                          color: "#43A047",
                        },
                        {
                          key: "delete",
                          title: "Delete My Account",
                          desc: "Permanently delete your account and data.",
                          icon: "ri-delete-bin-line",
                          color: "#E53935",
                          danger: true,
                        },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.key}
                          className={classnames("settings-shortcut-item", {
                            danger: item.danger,
                          })}
                        >
                          <span
                            className="settings-shortcut-icon"
                            style={{
                              background: `${item.color}18`,
                              color: item.color,
                            }}
                          >
                            <i className={item.icon} />
                          </span>
                          <div className="flex-grow-1 text-start min-w-0">
                            <div className="settings-right-title">{item.title}</div>
                            <div className="settings-right-desc">{item.desc}</div>
                          </div>
                          <i className="ri-arrow-right-s-line settings-right-chevron" />
                        </button>
                      ))}
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Data Usage</h5>
                      <p className="settings-section-desc mb-3">
                        Learn how we use your data.
                      </p>
                      <div className="settings-data-links">
                        <a href="#privacy-policy">
                          Privacy Policy
                          <i className="ri-external-link-line" />
                        </a>
                        <a href="#data-processing">
                          Data Processing Agreement
                          <i className="ri-external-link-line" />
                        </a>
                      </div>
                    </CardBody>
                  </Card>
                </>
              ) : tab === "task-defaults" ? (
                <>
                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Task Preview</h5>
                      <div className="settings-task-preview">
                        <div className="d-flex align-items-start gap-2">
                          <Input type="checkbox" className="mt-1" readOnly />
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-semibold">New Task</div>
                            <div className="d-flex flex-wrap gap-1 mt-2">
                              <span
                                className="settings-preview-pill"
                                style={{ color: "#556ee6", background: "#eef1ff" }}
                              >
                                {(masters?.statuses || []).find(
                                  (s) =>
                                    String(s.id) === String(taskDefaults.defaultStatusId)
                                )?.name || "To Do"}
                              </span>
                            </div>
                            <div className="settings-task-preview-meta">
                              <span>
                                <i className="ri-user-line" />{" "}
                                {taskDefaults.autoAssignMe ? "Me" : "Unassigned"}
                              </span>
                              <span>
                                <i className="ri-flag-2-line" style={{ color: "#FB8C00" }} />{" "}
                                {(masters?.priorities || []).find(
                                  (p) =>
                                    String(p.id) ===
                                    String(taskDefaults.defaultPriorityId)
                                )?.name || "Medium"}
                              </span>
                              <span>
                                <i className="ri-calendar-line" />{" "}
                                {taskPrefs.dueDateMode === "none"
                                  ? "No Due Date"
                                  : taskPrefs.dueDateMode === "today"
                                    ? "Today"
                                    : taskPrefs.dueDateMode === "tomorrow"
                                      ? "Tomorrow"
                                      : "In 1 week"}
                              </span>
                            </div>
                            <div className="d-flex flex-wrap gap-1 mt-2">
                              {(taskPrefs.tags || []).map((tag) => (
                                <span
                                  key={tag}
                                  className="settings-tag-chip"
                                  style={{
                                    background: `${TAG_COLORS[tag] || "#556ee6"}18`,
                                    color: TAG_COLORS[tag] || "#556ee6",
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="settings-task-preview-actions">
                              <i className="ri-attachment-2" />
                              <i className="ri-list-check-2" />
                              <i className="ri-chat-3-line" />
                              <i className="ri-more-fill" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Status Workflow (Default)</h5>
                      <div className="settings-workflow">
                        {[
                          { label: "To Do", color: "#556ee6" },
                          { label: "In Progress", color: "#FB8C00" },
                          { label: "Review", color: "#43A047" },
                          { label: "Done", color: "#878a99" },
                        ].map((s, idx, arr) => (
                          <React.Fragment key={s.label}>
                            <span
                              className="settings-workflow-pill"
                              style={{ background: `${s.color}18`, color: s.color }}
                            >
                              {s.label}
                            </span>
                            {idx < arr.length - 1 ? (
                              <i className="ri-arrow-right-s-line text-muted" />
                            ) : null}
                          </React.Fragment>
                        ))}
                      </div>
                      <button type="button" className="btn btn-link btn-sm p-0 mt-2">
                        <i className="ri-settings-3-line me-1" />
                        Manage Status Workflow
                      </button>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Other Options</h5>
                      {[
                        {
                          key: "autoMarkCompleted",
                          label: "Auto Mark Completed",
                          desc: "Mark overdue tasks completed automatically",
                        },
                        {
                          key: "lockCompleted",
                          label: "Lock Completed Tasks",
                          desc: "Prevent edits after completion",
                        },
                        {
                          key: "archiveCompleted",
                          label: "Archive Completed Tasks",
                          desc: "Move completed tasks to archive",
                        },
                      ].map((opt) => (
                        <div className="settings-other-option" key={opt.key}>
                          <div>
                            <div className="settings-right-title">{opt.label}</div>
                            <div className="settings-right-desc">{opt.desc}</div>
                          </div>
                          <div className="form-check form-switch mb-0">
                            <Input
                              type="switch"
                              checked={!!taskPrefs[opt.key]}
                              onChange={(e) => setTaskPref(opt.key, e.target.checked)}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 mt-2"
                        onClick={() => setTab("other")}
                      >
                        Manage More Settings
                        <i className="ri-arrow-right-s-line ms-1" />
                      </button>
                    </CardBody>
                  </Card>
                </>
              ) : tab === "other" ? (
                <>
                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Integrations</h5>
                      <p className="settings-section-desc mb-3">
                        Manage additional tools and services.
                      </p>
                      {[
                        {
                          key: "Google",
                          name: "Google Calendar",
                          desc: "Connect your Google Calendar",
                          icon: "ri-google-fill",
                          color: "#EA4335",
                        },
                        {
                          key: "Outlook",
                          name: "Outlook Calendar",
                          desc: "Connect your Outlook Calendar",
                          icon: "ri-microsoft-fill",
                          color: "#0078D4",
                        },
                        {
                          key: "Apple",
                          name: "Apple Calendar (iCloud)",
                          desc: "Sync with Apple Calendar",
                          icon: "ri-apple-fill",
                          color: "#111111",
                        },
                        {
                          key: "Zoom",
                          name: "Zoom",
                          desc: "Add Zoom to meetings you create",
                          icon: "ri-vidicon-line",
                          color: "#2D8CFF",
                        },
                      ].map((p) => (
                        <div className="settings-integration-row" key={p.key}>
                          <span
                            className="settings-integration-icon"
                            style={{ color: p.color }}
                          >
                            <i className={p.icon} />
                          </span>
                          <div className="flex-grow-1 min-w-0">
                            <div className="settings-right-title">{p.name}</div>
                            <div className="settings-right-desc">{p.desc}</div>
                          </div>
                          <button type="button" className="btn btn-link btn-sm p-0">
                            Manage
                          </button>
                        </div>
                      ))}
                      <button type="button" className="btn btn-link btn-sm p-0 mt-2">
                        View all integrations
                        <i className="ri-arrow-right-s-line ms-1" />
                      </button>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Default Reminders & Alerts</h5>
                      <p className="settings-section-desc mb-3">
                        Set global defaults for reminders and alerts.
                      </p>
                      <div className="settings-other-pref-row">
                        <div>
                          <div className="settings-right-title">Default Reminder Time</div>
                        </div>
                        <Input
                          type="select"
                          className="settings-inline-select settings-right-select"
                          value={taskDefaults.defaultReminderValue ?? 15}
                          onChange={(e) =>
                            setTaskDefaults({
                              ...taskDefaults,
                              defaultReminderValue: Number(e.target.value),
                            })
                          }
                        >
                          <option value={5}>5 minutes before</option>
                          <option value={15}>15 minutes before</option>
                          <option value={30}>30 minutes before</option>
                          <option value={60}>1 hour before</option>
                        </Input>
                      </div>
                      <div className="settings-other-pref-row">
                        <div>
                          <div className="settings-right-title">Default Alert Sound</div>
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Input
                            type="select"
                            className="settings-inline-select settings-right-select"
                            value={otherPrefs.alertSound}
                            onChange={(e) => setOtherPref("alertSound", e.target.value)}
                          >
                            <option value="chime">Chime</option>
                            <option value="ping">Ping</option>
                            <option value="bell">Bell</option>
                            <option value="none">None</option>
                          </Input>
                          <button
                            type="button"
                            className="settings-play-btn"
                            title="Preview sound"
                          >
                            <i className="ri-play-fill" />
                          </button>
                        </div>
                      </div>
                      <div className="settings-other-pref-row">
                        <div>
                          <div className="settings-right-title">Default Snooze Time</div>
                        </div>
                        <Input
                          type="select"
                          className="settings-inline-select settings-right-select"
                          value={otherPrefs.snoozeMinutes}
                          onChange={(e) =>
                            setOtherPref("snoozeMinutes", Number(e.target.value))
                          }
                        >
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                        </Input>
                      </div>
                    </CardBody>
                  </Card>

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">Other Preferences</h5>
                      <div className="settings-other-pref-row">
                        <div>
                          <div className="settings-right-title">Open Events In</div>
                        </div>
                        <Input
                          type="select"
                          className="settings-inline-select settings-right-select"
                          value={otherPrefs.openEventsIn}
                          onChange={(e) => setOtherPref("openEventsIn", e.target.value)}
                        >
                          <option value="popup">Popup</option>
                          <option value="sidebar">Sidebar</option>
                          <option value="page">Full Page</option>
                        </Input>
                      </div>
                      <div className="settings-other-option">
                        <div>
                          <div className="settings-right-title">Enable Keyboard Shortcuts</div>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <Input
                            type="switch"
                            checked={!!otherPrefs.keyboardShortcuts}
                            onChange={(e) =>
                              setOtherPref("keyboardShortcuts", e.target.checked)
                            }
                          />
                        </div>
                      </div>
                      <div className="settings-other-option">
                        <div>
                          <div className="settings-right-title">Show Tips & Suggestions</div>
                        </div>
                        <div className="form-check form-switch mb-0">
                          <Input
                            type="switch"
                            checked={!!otherPrefs.showTips}
                            onChange={(e) => setOtherPref("showTips", e.target.checked)}
                          />
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </>
              ) : (
                <>
                  {RIGHT_SECTIONS.map((section) => (
                    <Card className="settings-right-card border-0" key={section.title}>
                      <CardBody>
                        <h5 className="card-title">{section.title}</h5>
                        {section.items.map((item) => (
                          <button
                            type="button"
                            key={item.key}
                            className="settings-right-item"
                            onClick={() => {
                              selectWorkspace(item.key, item.tab);
                              setTab(item.tab);
                            }}
                          >
                            <span className="settings-right-icon">
                              <i className={item.icon} />
                            </span>
                            <div className="flex-grow-1 text-start min-w-0">
                              <div className="settings-right-title">{item.title}</div>
                              <div className="settings-right-desc">{item.desc}</div>
                            </div>
                            {item.badge ? (
                              <span className="settings-on-badge">{item.badge}</span>
                            ) : null}
                            {item.count != null ? (
                              <span className="settings-count-badge">{item.count}</span>
                            ) : null}
                            <i className="ri-arrow-right-s-line settings-right-chevron" />
                          </button>
                        ))}
                      </CardBody>
                    </Card>
                  ))}

                  <Card className="settings-right-card border-0">
                    <CardBody>
                      <h5 className="card-title">About Calendar</h5>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="fw-medium">Calendar Web App</span>
                        <span className="settings-on-badge">v2.0.0</span>
                      </div>
                      <p className="text-muted small mb-2">
                        All rights reserved. © 2025 SoftOnCloud Technologies.
                      </p>
                      <div className="settings-legal-links">
                        <a href="#privacy">Privacy Policy</a>
                        <span className="dot" />
                        <a href="#terms">Terms of Service</a>
                      </div>
                    </CardBody>
                  </Card>
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CalendarSettings;
