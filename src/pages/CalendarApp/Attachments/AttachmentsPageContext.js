import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getAttachmentStats,
  getMasters,
  getStorageUsage,
} from "../../../helpers/calendar_api";

export const ATTACHMENT_TABS = [
  { key: "all", label: "All Files", countKey: "allFiles" },
  { key: "by_item", label: "By Item / Task", countKey: "byItem" },
  { key: "by_type", label: "By Type", countKey: "byType" },
  { key: "recent", label: "Recent", countKey: "recent" },
  { key: "trash", label: "Trash", countKey: "trash" },
];

const defaultStats = {
  allFiles: 0,
  byItem: 0,
  byType: 0,
  recent: 0,
  trash: 0,
};

const defaultStorage = {
  usedBytes: 0,
  quotaBytes: 10 * 1024 * 1024 * 1024,
};

const AttachmentsPageContext = createContext(null);

export const formatBytes = (bytes) => {
  if (bytes == null || Number.isNaN(Number(bytes))) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = Number(bytes);
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

export const AttachmentsPageProvider = ({ children }) => {
  const [tab, setTab] = useState("all");
  const [stats, setStats] = useState(defaultStats);
  const [storage, setStorage] = useState(defaultStorage);
  const [masters, setMasters] = useState(null);
  const [calendarId, setCalendarId] = useState("");
  const [attachmentTypeId, setAttachmentTypeId] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [uploadTrigger, setUploadTrigger] = useState(0);

  const refreshMeta = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([
        getAttachmentStats().catch(() => null),
        getStorageUsage().catch(() => null),
      ]);
      if (s) {
        setStats({
          allFiles: s.allFiles ?? 0,
          byItem: s.byItem ?? 0,
          byType: s.byType ?? 0,
          recent: s.recent ?? 0,
          trash: s.trash ?? 0,
        });
      }
      if (u) {
        setStorage({
          usedBytes: u.usedBytes ?? 0,
          quotaBytes: u.quotaBytes ?? defaultStorage.quotaBytes,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, m] = await Promise.all([
          getAttachmentStats().catch(() => null),
          getStorageUsage().catch(() => null),
          getMasters().catch(() => ({})),
        ]);
        if (s) {
          setStats({
            allFiles: s.allFiles ?? 0,
            byItem: s.byItem ?? 0,
            byType: s.byType ?? 0,
            recent: s.recent ?? 0,
            trash: s.trash ?? 0,
          });
        }
        if (u) {
          setStorage({
            usedBytes: u.usedBytes ?? 0,
            quotaBytes: u.quotaBytes ?? defaultStorage.quotaBytes,
          });
        }
        setMasters(m || {});
      } catch {
        setMasters({});
      }
    };
    load();
  }, []);

  const clearDropdownFilters = useCallback(() => {
    setCalendarId("");
    setAttachmentTypeId("");
    setUploadedBy("");
  }, []);

  const requestUpload = useCallback(() => {
    setUploadTrigger((n) => n + 1);
  }, []);

  const buildAttachmentParams = useCallback(
    (extra = {}) => {
      const params = {
        tab,
        page: 1,
        pageSize: 10,
        ...extra,
      };
      if (calendarId) params.calendarId = calendarId;
      if (attachmentTypeId) params.attachmentTypeId = attachmentTypeId;
      if (uploadedBy) params.uploadedBy = uploadedBy;
      return params;
    },
    [tab, calendarId, attachmentTypeId, uploadedBy]
  );

  const value = useMemo(
    () => ({
      tab,
      setTab,
      stats,
      storage,
      refreshMeta,
      masters,
      calendarId,
      setCalendarId,
      attachmentTypeId,
      setAttachmentTypeId,
      uploadedBy,
      setUploadedBy,
      selectedId,
      setSelectedId,
      clearDropdownFilters,
      buildAttachmentParams,
      uploadTrigger,
      requestUpload,
    }),
    [
      tab,
      stats,
      storage,
      refreshMeta,
      masters,
      calendarId,
      attachmentTypeId,
      uploadedBy,
      selectedId,
      clearDropdownFilters,
      buildAttachmentParams,
      uploadTrigger,
      requestUpload,
    ]
  );

  return (
    <AttachmentsPageContext.Provider value={value}>
      {children}
    </AttachmentsPageContext.Provider>
  );
};

export const useAttachmentsPage = () => {
  const ctx = useContext(AttachmentsPageContext);
  if (!ctx) throw new Error("useAttachmentsPage must be used within AttachmentsPageProvider");
  return ctx;
};

export const useAttachmentsPageOptional = () => useContext(AttachmentsPageContext);
