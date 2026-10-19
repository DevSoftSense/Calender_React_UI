import React from "react";
import { Link, useLocation } from "react-router-dom";
import classnames from "classnames";
import {
  ASSIGNMENT_STATUS_FILTERS,
  useAssignmentsPageOptional,
} from "./AssignmentsPageContext";
import "./assignments.css";

const AssignmentsLeftPanel = () => {
  const location = useLocation();
  const ctx = useAssignmentsPageOptional();

  if (!location.pathname.startsWith("/calendar-assignments") || !ctx) {
    return null;
  }

  const { summary, statusFilter, setStatusFilter } = ctx;

  return (
    <div className="assign-sidebar-panel">
      <div className="assign-sidebar-card">
        <div className="assign-sidebar-card-title">My Assignments</div>
        {ASSIGNMENT_STATUS_FILTERS.map((s) => {
          const count = summary[s.summaryKey] ?? 0;
          const active = statusFilter === s.key;
          return (
            <button
              type="button"
              key={s.key}
              className={classnames("assign-sidebar-row", { active })}
              style={{ "--row-color": s.color }}
              onClick={() => setStatusFilter(active ? "" : s.key)}
            >
              <span className="assign-row-icon" style={{ color: s.color }}>
                <i className={s.icon} />
              </span>
              <span className="assign-row-label">{s.label}</span>
              <span className="assign-row-badge" style={{ background: `${s.color}22`, color: s.color }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Link to="/calendar-items" className="assign-sidebar-btn">
        <i className="ri-add-line me-1" />
        Assign Item
      </Link>
    </div>
  );
};

export default AssignmentsLeftPanel;
