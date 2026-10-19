import axios from "axios";
import { api } from "../config";

// const BASE_URL = api.API_URL || process.env.REACT_APP_API_URL || "http://localhost:5116";
const BASE_URL = api.API_URL || process.env.REACT_APP_API_URL || "https://calapi.softoncloud.com/";

const calendarAxios = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getAuthToken = () => {
  try {
    const raw = sessionStorage.getItem("authUser");
    const authUser = raw ? JSON.parse(raw) : null;
    return (
      authUser?.token ||
      authUser?.accessToken ||
      authUser?.data?.accessToken ||
      null
    );
  } catch (_) {
    return null;
  }
};

calendarAxios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Unwrap ApiResponse { success, data, message, errors }
 */
const unwrap = async (promise) => {
  try {
    const response = await promise;
    const body = response?.data;
    if (body && typeof body === "object" && Object.prototype.hasOwnProperty.call(body, "success")) {
      if (body.success) {
        return body.data;
      }
      const err = new Error(body.message || "Request failed");
      err.errors = body.errors;
      err.status = response.status;
      throw err;
    }
    return body;
  } catch (error) {
    if (error.response) {
      const body = error.response.data;
      const message =
        (body && (body.message || body.title)) ||
        error.message ||
        "Request failed";
      const err = new Error(message);
      err.errors = body?.errors;
      err.status = error.response.status;
      throw err;
    }
    throw error;
  }
};

const safeList = async (fn) => {
  try {
    const data = await fn();
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    return data || [];
  } catch (error) {
    if (error?.status === 404 || error?.status === 501) {
      return [];
    }
    return [];
  }
};

// ---------------- Auth ----------------
export const loginCalendar = async (email, password) => {
  return unwrap(
    calendarAxios.post("/api/v1/auth/login", { email, password })
  );
};

// ---------------- Dashboard / Masters / Calendars ----------------
export const getDashboard = () =>
  unwrap(calendarAxios.get("/api/v1/dashboard"));

export const getMasters = () =>
  unwrap(calendarAxios.get("/api/v1/masters"));

export const getCalendars = () =>
  unwrap(calendarAxios.get("/api/v1/calendars"));

// ---------------- Items ----------------
export const getItems = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/items", { params }));

export const getItem = (id) =>
  unwrap(calendarAxios.get(`/api/v1/items/${id}`));

export const createItem = (payload) =>
  unwrap(calendarAxios.post("/api/v1/items", payload));

export const updateItem = (id, payload) =>
  unwrap(calendarAxios.put(`/api/v1/items/${id}`, payload));

export const deleteItem = (id) =>
  unwrap(calendarAxios.delete(`/api/v1/items/${id}`));

export const getItemSummary = () =>
  unwrap(calendarAxios.get("/api/v1/items/summary"));

export const getItemActivity = (id) =>
  unwrap(calendarAxios.get(`/api/v1/items/${id}/activity`));

export const getItemComments = (id) =>
  unwrap(calendarAxios.get(`/api/v1/items/${id}/comments`));

export const addItemComment = (id, payload) =>
  unwrap(calendarAxios.post(`/api/v1/items/${id}/comments`, payload));

export const getItemReminders = (id) =>
  unwrap(calendarAxios.get(`/api/v1/items/${id}/reminders`));

export const getItemAttachments = (id) =>
  unwrap(calendarAxios.get(`/api/v1/items/${id}/attachments`));

export const getItemRecurrence = (id) =>
  unwrap(calendarAxios.get(`/api/v1/items/${id}/recurrence`));

export const upsertItemRecurrence = (id, payload) =>
  unwrap(calendarAxios.put(`/api/v1/items/${id}/recurrence`, payload));

export const deleteItemRecurrence = (id) =>
  unwrap(calendarAxios.delete(`/api/v1/items/${id}/recurrence`));

// ---------------- Assignments ----------------
export const getAssignments = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/assignments", { params }));

export const getAssignmentSummary = () =>
  unwrap(calendarAxios.get("/api/v1/assignments/summary"));

export const createAssignment = (payload) =>
  unwrap(calendarAxios.post("/api/v1/assignments", payload));

export const getUpcomingDeadlines = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/assignments/upcoming", { params }));

export const getTopAssignees = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/assignments/top-assignees", { params }));

// ---------------- Reminders ----------------
export const getRemindersList = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/reminders", { params }));

export const getReminderSummary = () =>
  unwrap(calendarAxios.get("/api/v1/reminders/summary"));

export const createReminder = (payload) =>
  unwrap(calendarAxios.post("/api/v1/reminders", payload));

export const updateReminder = (id, payload) =>
  unwrap(calendarAxios.put(`/api/v1/reminders/${id}`, payload));

export const deleteReminder = (id) =>
  unwrap(calendarAxios.delete(`/api/v1/reminders/${id}`));

// ---------------- Attachments ----------------
export const getAttachmentsList = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/attachments", { params }));

export const getAttachmentStats = () =>
  unwrap(calendarAxios.get("/api/v1/attachments/stats"));

export const getStorageUsage = () =>
  unwrap(calendarAxios.get("/api/v1/attachments/storage"));

export const getAttachment = (id) =>
  unwrap(calendarAxios.get(`/api/v1/attachments/${id}`));

export const uploadAttachment = (formData) =>
  unwrap(
    calendarAxios.post("/api/v1/attachments/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  );

export const deleteAttachment = (id) =>
  unwrap(calendarAxios.delete(`/api/v1/attachments/${id}`));

export const getAttachmentDownloadUrl = (id) =>
  `${BASE_URL}/api/v1/attachments/${id}/download`;

// ---------------- Activity ----------------
export const getActivityList = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/activity", { params }));

export const getActivitySummary = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/activity/summary", { params }));

export const getTopActiveUsers = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/activity/top-users", { params }));

// ---------------- Notifications ----------------
export const getNotifications = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/notifications", { params }));

export const getUnreadNotificationCount = () =>
  unwrap(calendarAxios.get("/api/v1/notifications/unread-count"));

export const markNotificationRead = (id) =>
  unwrap(calendarAxios.post(`/api/v1/notifications/${id}/read`));

export const markAllNotificationsRead = () =>
  unwrap(calendarAxios.post("/api/v1/notifications/read-all"));

// ---------------- Settings ----------------
export const getGeneralSettings = () =>
  unwrap(calendarAxios.get("/api/v1/settings/general"));

export const updateGeneralSettings = (payload) =>
  unwrap(calendarAxios.put("/api/v1/settings/general", payload));

export const getNotificationSettings = () =>
  unwrap(calendarAxios.get("/api/v1/settings/notifications"));

export const updateNotificationSettings = (payload) =>
  unwrap(calendarAxios.put("/api/v1/settings/notifications", payload));

export const getTaskDefaults = () =>
  unwrap(calendarAxios.get("/api/v1/settings/task-defaults"));

export const updateTaskDefaults = (payload) =>
  unwrap(calendarAxios.put("/api/v1/settings/task-defaults", payload));

export const getIntegrations = () =>
  unwrap(calendarAxios.get("/api/v1/settings/integrations"));

export const updateIntegration = (payload) =>
  unwrap(calendarAxios.put("/api/v1/settings/integrations", payload));

export const getPrivacySettings = () =>
  unwrap(calendarAxios.get("/api/v1/settings/privacy"));

export const updatePrivacySettings = (payload) =>
  unwrap(calendarAxios.put("/api/v1/settings/privacy", payload));

export const getUserPreferences = (group) =>
  unwrap(calendarAxios.get(`/api/v1/settings/preferences/${group}`));

export const updateUserPreferences = (group, preferences) =>
  unwrap(
    calendarAxios.put(`/api/v1/settings/preferences/${group}`, {
      preferences,
    })
  );

// ---------------- Auth / Calendar helpers ----------------
export const getMe = () => unwrap(calendarAxios.get("/api/v1/auth/me"));

export const getCalendarDayDots = (params = {}) =>
  unwrap(calendarAxios.get("/api/v1/calendars/day-dots", { params }));

// ---------------- Search ----------------
export const searchGlobal = (q) =>
  unwrap(calendarAxios.get("/api/v1/search", { params: { q } }));

export default calendarAxios;
