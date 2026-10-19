import React from "react";
import { useLocation } from "react-router-dom";
import {
  formatBytes,
  useAttachmentsPageOptional,
} from "./AttachmentsPageContext";
import "./attachments.css";

const AttachmentsLeftPanel = () => {
  const location = useLocation();
  const ctx = useAttachmentsPageOptional();

  if (!location.pathname.startsWith("/calendar-attachments") || !ctx) {
    return null;
  }

  const { storage, requestUpload } = ctx;
  const used = storage.usedBytes ?? 0;
  const quota = storage.quotaBytes || 1;
  const pct = Math.min(100, Math.round((used / quota) * 1000) / 10);

  return (
    <div className="attachments-sidebar-panel">
      <div className="attachments-sidebar-card">
        <div className="attachments-sidebar-card-title">
          <span>Storage Usage</span>
          <i className="ri-cloud-line" />
        </div>
        <p className="attachments-storage-text">
          {formatBytes(used)} of {formatBytes(quota)} used
        </p>
        <div className="attachments-storage-bar">
          <div className="attachments-storage-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="attachments-storage-pct">{pct}%</div>
      </div>

      <button type="button" className="attachments-sidebar-btn" onClick={requestUpload}>
        <i className="ri-upload-2-line me-1" />
        Upload Files
      </button>
    </div>
  );
};

export default AttachmentsLeftPanel;
