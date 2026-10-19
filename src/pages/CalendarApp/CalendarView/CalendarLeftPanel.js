import React from "react";
import { Link, useLocation } from "react-router-dom";
import classnames from "classnames";
import { useCalendarPageOptional } from "./CalendarPageContext";
import "./calendar.css";

const SidebarMiniCalendar = ({
  monthDate,
  selectedDate,
  onPickDate,
  onPrevMonth,
  onNextMonth,
}) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const cells = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const monthLabel = monthDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="calendar-sidebar-mini">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button type="button" className="cal-nav-btn" onClick={onPrevMonth}>
          <i className="ri-arrow-left-s-line" />
        </button>
        <span className="cal-mini-title">{monthLabel}</span>
        <button type="button" className="cal-nav-btn" onClick={onNextMonth}>
          <i className="ri-arrow-right-s-line" />
        </button>
      </div>
      <div className="cal-mini-grid weekdays">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="cal-mini-grid">
        {cells.map((d, i) => {
          const isToday =
            d &&
            today.getDate() === d &&
            today.getMonth() === month &&
            today.getFullYear() === year;
          const isSelected =
            d &&
            selectedDate &&
            selectedDate.getDate() === d &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;
          return (
            <button
              type="button"
              key={i}
              className={classnames("day", { today: isToday, selected: isSelected && !isToday })}
              onClick={() => d && onPickDate(new Date(year, month, d))}
            >
              {d || ""}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CalendarLeftPanel = () => {
  const location = useLocation();
  const ctx = useCalendarPageOptional();

  if (!location.pathname.startsWith("/apps-calendar") || !ctx) {
    return null;
  }

  const {
    calendars,
    selectedCalIds,
    toggleCalendar,
    miniMonth,
    setMiniMonth,
    selectedDate,
    goToDate,
  } = ctx;

  return (
    <div className="calendar-sidebar-extras">
      <SidebarMiniCalendar
        monthDate={miniMonth}
        selectedDate={selectedDate}
        onPickDate={goToDate}
        onPrevMonth={() =>
          setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() - 1, 1))
        }
        onNextMonth={() =>
          setMiniMonth(new Date(miniMonth.getFullYear(), miniMonth.getMonth() + 1, 1))
        }
      />

      <div className="calendar-sidebar-calendars">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="calendars-heading">Calendars</span>
          <Link to="/calendar-settings" className="cal-add-btn" title="Add calendar">
            <i className="ri-add-line" />
          </Link>
        </div>

        {calendars.map((c) => {
          const color = c.color || "#556ee6";
          const checked = selectedCalIds.includes(c.calendarId);
          return (
            <label
              className="cal-color-checkbox"
              key={c.calendarId}
              htmlFor={`sidebar-cal-${c.calendarId}`}
              style={{ "--cal-color": color }}
            >
              <input
                type="checkbox"
                id={`sidebar-cal-${c.calendarId}`}
                checked={checked}
                onChange={() => toggleCalendar(c.calendarId)}
              />
              <span className={classnames("cal-color-checkbox-box", { checked })}>
                <i className="ri-check-line" />
              </span>
              <span className="cal-filter-label">{c.calendarName}</span>
            </label>
          );
        })}
        <Link to="/calendar-settings" className="manage-calendars-link">
          <i className="ri-settings-3-line me-1" />
          Manage Calendars
        </Link>
      </div>
    </div>
  );
};

export default CalendarLeftPanel;
