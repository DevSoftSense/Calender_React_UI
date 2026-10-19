import React from "react";

const Navdata = () => {
  const menuItems = [
    {
      label: "Menu",
      isHeader: true,
    },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "ri-dashboard-2-line",
      link: "/dashboard",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: "ri-calendar-2-line",
      link: "/apps-calendar",
    },
    {
      id: "calendar-items",
      label: "Items",
      icon: "ri-task-line",
      link: "/calendar-items",
    },
    {
      id: "calendar-assignments",
      label: "Assignments",
      icon: "ri-user-shared-line",
      link: "/calendar-assignments",
    },
    {
      id: "calendar-reminders",
      label: "Reminders",
      icon: "ri-notification-3-line",
      link: "/calendar-reminders",
    },
    {
      id: "calendar-attachments",
      label: "Attachments",
      icon: "ri-attachment-2",
      link: "/calendar-attachments",
    },
    {
      id: "calendar-activity",
      label: "Activity",
      icon: "ri-history-line",
      link: "/calendar-activity",
    },
    {
      id: "calendar-settings",
      label: "Settings",
      icon: "ri-settings-3-line",
      link: "/calendar-settings",
    },
  ];

  return <React.Fragment>{menuItems}</React.Fragment>;
};

export default Navdata;
