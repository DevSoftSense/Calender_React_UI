import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAssignmentSummary } from "../../../helpers/calendar_api";

export const ASSIGNMENT_STATUS_FILTERS = [
  { key: "pending", label: "Pending", summaryKey: "pending", color: "#FB8C00", icon: "ri-time-line" },
  { key: "in_progress", label: "In Progress", summaryKey: "inProgress", color: "#1E88E5", icon: "ri-loader-4-line" },
  { key: "completed", label: "Completed", summaryKey: "completed", color: "#43A047", icon: "ri-checkbox-circle-line" },
  { key: "overdue", label: "Overdue", summaryKey: "overdue", color: "#E53935", icon: "ri-alarm-warning-line" },
  {
    key: "waiting_approval",
    label: "Waiting Approval",
    summaryKey: "waitingApproval",
    color: "#8E24AA",
    icon: "ri-file-list-3-line",
  },
];

export const ASSIGNMENT_VIEWS = [
  { key: "assigned_to_me", label: "Assigned To Me" },
  { key: "assigned_by_me", label: "Assigned By Me" },
  { key: "team", label: "Team Assignments" },
  { key: "waiting_approval", label: "Waiting Approval" },
];

const AssignmentsPageContext = createContext(null);

export const AssignmentsPageProvider = ({ children }) => {
  const [view, setView] = useState("assigned_to_me");
  const [summary, setSummary] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [statusId, setStatusId] = useState("");

  const refreshSummary = useCallback(async () => {
    try {
      const s = await getAssignmentSummary();
      setSummary(s || {});
    } catch {
      setSummary({});
    }
  }, []);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  const value = useMemo(
    () => ({
      view,
      setView,
      summary,
      refreshSummary,
      statusFilter,
      setStatusFilter,
      priorityId,
      setPriorityId,
      calendarId,
      setCalendarId,
      statusId,
      setStatusId,
      clearDropdownFilters: () => {
        setPriorityId("");
        setCalendarId("");
        setStatusId("");
      },
    }),
    [view, summary, refreshSummary, statusFilter, priorityId, calendarId, statusId]
  );

  return (
    <AssignmentsPageContext.Provider value={value}>
      {children}
    </AssignmentsPageContext.Provider>
  );
};

export const useAssignmentsPage = () => {
  const ctx = useContext(AssignmentsPageContext);
  if (!ctx) throw new Error("useAssignmentsPage must be used within AssignmentsPageProvider");
  return ctx;
};

export const useAssignmentsPageOptional = () => useContext(AssignmentsPageContext);
