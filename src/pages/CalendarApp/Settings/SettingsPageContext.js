import React, { createContext, useContext, useMemo, useState } from "react";

export const SETTINGS_TABS = [
  { key: "general", label: "General", icon: "ri-settings-3-line" },
  { key: "calendar", label: "Calendar", icon: "ri-calendar-line" },
  { key: "notifications", label: "Notifications", icon: "ri-notification-3-line" },
  { key: "reminders", label: "Reminders", icon: "ri-alarm-line" },
  { key: "task-defaults", label: "Task Defaults", icon: "ri-task-line" },
  { key: "privacy", label: "Privacy & Security", icon: "ri-shield-keyhole-line" },
  { key: "other", label: "Others", icon: "ri-more-line" },
];

export const WORKSPACE_LINKS = [
  { key: "profile", label: "Profile", icon: "ri-user-line", tab: "privacy" },
  { key: "team", label: "Team", icon: "ri-group-line", tab: "other" },
  { key: "billing", label: "Billing & Plan", icon: "ri-bank-card-line", tab: "other" },
  { key: "integrations", label: "Integrations", icon: "ri-puzzle-line", tab: "other" },
  { key: "import-export", label: "Import / Export", icon: "ri-import-export-line", tab: "other" },
  { key: "trash", label: "Trash", icon: "ri-delete-bin-line", tab: "other" },
];

export const COLOR_PALETTE = [
  { key: "blue", color: "#556ee6" },
  { key: "purple", color: "#7E57C2" },
  { key: "pink", color: "#EC407A" },
  { key: "orange", color: "#FB8C00" },
  { key: "green", color: "#43A047" },
  { key: "teal", color: "#00ACC1" },
  { key: "slate", color: "#546E7A" },
];

const SettingsPageContext = createContext(null);

export const SettingsPageProvider = ({ children }) => {
  const [tab, setTab] = useState("general");
  const [workspaceFocus, setWorkspaceFocus] = useState("");
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem("calendarAccentColor") || "blue"
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    () => Number(localStorage.getItem("calendarItemsPerPage") || 25)
  );
  const [workspaceName, setWorkspaceName] = useState(
    () => localStorage.getItem("calendarWorkspaceName") || "My Workspace"
  );

  const selectWorkspace = (key, tabKey) => {
    setWorkspaceFocus(key);
    if (tabKey) setTab(tabKey);
  };

  const saveAccent = (key) => {
    setAccentColor(key);
    localStorage.setItem("calendarAccentColor", key);
  };

  const saveItemsPerPage = (n) => {
    setItemsPerPage(n);
    localStorage.setItem("calendarItemsPerPage", String(n));
  };

  const saveWorkspaceName = (name) => {
    setWorkspaceName(name);
    localStorage.setItem("calendarWorkspaceName", name);
  };

  const value = useMemo(
    () => ({
      tab,
      setTab,
      workspaceFocus,
      selectWorkspace,
      accentColor,
      saveAccent,
      itemsPerPage,
      saveItemsPerPage,
      workspaceName,
      setWorkspaceName,
      saveWorkspaceName,
    }),
    [tab, workspaceFocus, accentColor, itemsPerPage, workspaceName]
  );

  return (
    <SettingsPageContext.Provider value={value}>{children}</SettingsPageContext.Provider>
  );
};

export const useSettingsPage = () => {
  const ctx = useContext(SettingsPageContext);
  if (!ctx) throw new Error("useSettingsPage must be used within SettingsPageProvider");
  return ctx;
};

export const useSettingsPageOptional = () => useContext(SettingsPageContext);
