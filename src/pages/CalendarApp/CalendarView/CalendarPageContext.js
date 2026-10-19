import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCalendars } from "../../../helpers/calendar_api";

const DEFAULT_CALENDARS = [
  { calendarId: "my", calendarName: "My Calendar", color: "#556ee6" },
  { calendarId: "work", calendarName: "Work", color: "#43A047" },
  { calendarId: "personal", calendarName: "Personal", color: "#8E24AA" },
  { calendarId: "payments", calendarName: "Payments", color: "#FB8C00" },
  { calendarId: "birthdays", calendarName: "Birthdays", color: "#D81B60" },
  { calendarId: "holidays", calendarName: "Holidays", color: "#757575" },
];

const CALENDAR_COLOR_PALETTE = [
  "#556ee6",
  "#43A047",
  "#8E24AA",
  "#FB8C00",
  "#D81B60",
  "#757575",
  "#1E88E5",
  "#00897B",
];

const colorForCalendar = (calendar, index) => {
  if (calendar.color) return calendar.color;
  const name = String(calendar.calendarName || "").toLowerCase();
  const byName = DEFAULT_CALENDARS.find((d) =>
    name.includes(d.calendarName.toLowerCase().split(" ")[0])
  );
  if (byName) return byName.color;
  return CALENDAR_COLOR_PALETTE[index % CALENDAR_COLOR_PALETTE.length];
};

const withCalendarColors = (list) =>
  list.map((c, i) => ({ ...c, color: colorForCalendar(c, i) }));

const CalendarPageContext = createContext(null);

export const CalendarPageProvider = ({ children }) => {
  const [calendars, setCalendars] = useState([]);
  const [selectedCalIds, setSelectedCalIds] = useState([]);
  const [miniMonth, setMiniMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const goToDateRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = (await getCalendars()) || [];
        const arr = Array.isArray(list) ? list : [];
        if (arr.length > 0) {
          setCalendars(withCalendarColors(arr));
          setSelectedCalIds(arr.map((c) => c.calendarId));
        } else {
          setCalendars(DEFAULT_CALENDARS);
          setSelectedCalIds(DEFAULT_CALENDARS.map((c) => c.calendarId));
        }
      } catch {
        setCalendars(DEFAULT_CALENDARS);
        setSelectedCalIds(DEFAULT_CALENDARS.map((c) => c.calendarId));
      }
    };
    load();
  }, []);

  const registerGoToDateHandler = useCallback((fn) => {
    goToDateRef.current = fn;
  }, []);

  const goToDate = useCallback((date) => {
    setSelectedDate(date);
    setMiniMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    goToDateRef.current?.(date);
  }, []);

  const toggleCalendar = useCallback((id) => {
    setSelectedCalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const displayCalendars = useMemo(
    () => (calendars.length > 0 ? calendars : DEFAULT_CALENDARS),
    [calendars]
  );

  const value = useMemo(
    () => ({
      calendars: displayCalendars,
      selectedCalIds,
      setSelectedCalIds,
      toggleCalendar,
      miniMonth,
      setMiniMonth,
      selectedDate,
      setSelectedDate,
      goToDate,
      registerGoToDateHandler,
      usingDefaultCalendars: calendars.length === 0,
    }),
    [
      displayCalendars,
      calendars.length,
      selectedCalIds,
      toggleCalendar,
      miniMonth,
      selectedDate,
      goToDate,
      registerGoToDateHandler,
    ]
  );

  return (
    <CalendarPageContext.Provider value={value}>{children}</CalendarPageContext.Provider>
  );
};

export const useCalendarPage = () => {
  const ctx = useContext(CalendarPageContext);
  if (!ctx) {
    throw new Error("useCalendarPage must be used within CalendarPageProvider");
  }
  return ctx;
};

export const useCalendarPageOptional = () => useContext(CalendarPageContext);
