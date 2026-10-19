import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import classnames from "classnames";
import { Input } from "reactstrap";
import {
  ACTIVITY_PERIODS,
  ACTIVITY_TYPE_FILTERS,
  useActivityPageOptional,
} from "./ActivityPageContext";
import "./activity.css";

const ActivityLeftPanel = () => {
  const location = useLocation();
  const ctx = useActivityPageOptional();
  const [showCustom, setShowCustom] = useState(false);

  if (!location.pathname.startsWith("/calendar-activity") || !ctx) {
    return null;
  }

  const {
    period,
    setPeriod,
    activityTypeKey,
    setActivityTypeKey,
    periodCounts,
    typeCounts,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
  } = ctx;

  return (
    <div className="activity-sidebar-panel">
      <div className="activity-sidebar-card">
        <div className="activity-sidebar-heading">
          <span>Filters</span>
          <i className="ri-settings-3-line" />
        </div>

        {ACTIVITY_PERIODS.map((p) => {
          const countKey = p.key || "all";
          const count = periodCounts[countKey];
          const active = p.custom
            ? period === "custom"
            : period === p.key;
          return (
            <button
              type="button"
              key={p.key || "all"}
              className={classnames("activity-filter-row", { active })}
              style={{ "--row-color": p.color }}
              onClick={() => {
                if (p.custom) {
                  setPeriod("custom");
                  setShowCustom(true);
                } else {
                  setPeriod(p.key);
                  setShowCustom(false);
                }
              }}
            >
              <span className="activity-filter-icon" style={{ color: p.color }}>
                <i className={p.icon} />
              </span>
              <span className="activity-filter-label">{p.label}</span>
              {p.custom ? (
                <i className="ri-calendar-2-line activity-filter-cal" />
              ) : (
                <span
                  className="activity-filter-badge"
                  style={{
                    background: active ? `${p.color}22` : "#f0f2f8",
                    color: active ? p.color : "#878a99",
                  }}
                >
                  {count ?? 0}
                </span>
              )}
            </button>
          );
        })}

        {(showCustom || period === "custom") && (
          <div className="activity-custom-range">
            <Input
              type="date"
              bsSize="sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <Input
              type="date"
              bsSize="sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        )}

        <div className="activity-sidebar-divider" />

        <div className="activity-sidebar-heading">
          <span>Activity Type</span>
        </div>

        {ACTIVITY_TYPE_FILTERS.map((t) => {
          const active = activityTypeKey === t.key;
          return (
            <button
              type="button"
              key={t.key}
              className={classnames("activity-type-row", { active })}
              style={{ "--row-color": t.color }}
              onClick={() => setActivityTypeKey(active ? "" : t.key)}
            >
              <span
                className="activity-type-dot"
                style={{ background: t.color }}
              />
              <span className="activity-type-label">{t.label}</span>
              <span
                className="activity-filter-badge"
                style={{
                  background: active ? `${t.color}22` : "#f0f2f8",
                  color: active ? t.color : "#878a99",
                }}
              >
                {typeCounts[t.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityLeftPanel;
