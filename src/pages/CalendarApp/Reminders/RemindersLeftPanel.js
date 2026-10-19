import React from "react";
import { Link, useLocation } from "react-router-dom";
import classnames from "classnames";
import {
  REMINDER_CHANNELS,
  useRemindersPageOptional,
} from "./RemindersPageContext";
import "./reminders.css";

const RemindersLeftPanel = () => {
  const location = useLocation();
  const ctx = useRemindersPageOptional();

  if (!location.pathname.startsWith("/calendar-reminders") || !ctx) {
    return null;
  }

  const { channelPrefs, toggleChannel, channelSaving } = ctx;

  return (
    <div className="reminders-sidebar-panel">
      <div className="reminders-sidebar-card">
        <div className="reminders-sidebar-card-title">
          <span>Reminder Channels</span>
          <Link to="/calendar-settings" className="reminders-sidebar-gear" title="Settings">
            <i className="ri-settings-3-line" />
          </Link>
        </div>
        {REMINDER_CHANNELS.map((ch) => {
          const on = !!channelPrefs[ch.key];
          return (
            <button
              type="button"
              key={ch.key}
              className={classnames("reminders-channel-row", { on })}
              disabled={channelSaving}
              onClick={() => toggleChannel(ch.key)}
            >
              <span
                className="reminders-channel-icon"
                style={{ background: ch.bg, color: ch.color }}
              >
                <i className={ch.icon} />
              </span>
              <span className="reminders-channel-label">{ch.label}</span>
              <span className={classnames("reminders-channel-status", { on })}>
                {on ? "On" : "Off"}
              </span>
            </button>
          );
        })}
      </div>

      <Link to="/calendar-items" className="reminders-sidebar-btn">
        <i className="ri-add-line me-1" />
        Add Reminder
      </Link>
    </div>
  );
};

export default RemindersLeftPanel;
