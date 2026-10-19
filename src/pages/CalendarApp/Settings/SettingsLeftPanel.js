import React from "react";
import { useLocation } from "react-router-dom";
import classnames from "classnames";
import { WORKSPACE_LINKS, useSettingsPageOptional } from "./SettingsPageContext";
import "./settings.css";

const SettingsLeftPanel = () => {
  const location = useLocation();
  const ctx = useSettingsPageOptional();

  if (!location.pathname.startsWith("/calendar-settings") || !ctx) {
    return null;
  }

  const { workspaceFocus, selectWorkspace } = ctx;

  return (
    <div className="settings-sidebar-panel">
      <div className="settings-sidebar-card">
        <div className="settings-sidebar-heading">Workspace</div>
        {WORKSPACE_LINKS.map((link) => (
          <button
            type="button"
            key={link.key}
            className={classnames("settings-workspace-row", {
              active: workspaceFocus === link.key,
            })}
            onClick={() => selectWorkspace(link.key, link.tab)}
          >
            <i className={link.icon} />
            <span>{link.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-help-card">
        <div className="settings-help-title">Need Help?</div>
        <p className="settings-help-text">
          Visit our Help Center or contact support.
        </p>
        <a
          href="https://softoncloud.com"
          target="_blank"
          rel="noreferrer"
          className="settings-help-btn"
        >
          Go to Help Center
          <i className="ri-external-link-line ms-1" />
        </a>
      </div>
    </div>
  );
};

export default SettingsLeftPanel;
