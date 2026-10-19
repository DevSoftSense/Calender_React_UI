import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Nav,
  NavItem,
  NavLink,
  Pagination,
  PaginationItem,
  PaginationLink,
  Row,
  Spinner,
  Table,
} from "reactstrap";
import classnames from "classnames";
import { Link } from "react-router-dom";
import {
  getCalendars,
  getCalendarDayDots,
  getRemindersList,
} from "../../../helpers/calendar_api";
import { REMINDER_TABS, useRemindersPage } from "./RemindersPageContext";
import "./reminders.css";

const OVERVIEW_CARDS = [
  { key: "total", label: "Total Reminders", icon: "ri-notification-3-line", color: "#556ee6" },
  { key: "scheduled", label: "Scheduled", icon: "ri-checkbox-circle-line", color: "#43A047" },
  { key: "dueToday", label: "Due Today", icon: "ri-time-line", color: "#FB8C00" },
  { key: "thisWeek", label: "This Week", icon: "ri-calendar-line", color: "#7E57C2" },
  { key: "missed", label: "Missed", icon: "ri-notification-off-line", color: "#E53935" },
  { key: "completed", label: "Completed", icon: "ri-check-double-line", color: "#3949AB" },
];

const UPCOMING_DOT_COLORS = ["#E53935", "#43A047", "#FB8C00", "#7E57C2", "#00ACC1"];

const CHANNEL_ICON_MAP = {
  "in-app": "ri-notification-3-line",
  inapp: "ri-notification-3-line",
  email: "ri-mail-line",
  sms: "ri-chat-3-line",
  whatsapp: "ri-whatsapp-line",
  push: "ri-smartphone-line",
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(d).slice(0, 10);
  }
};

const formatTime = (t) => {
  if (!t) return null;
  const s = String(t);
  const hhmm = s.length >= 5 ? s.slice(0, 5) : s;
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${mStr || "00"} ${ampm}`;
};

const relativeDueLabel = (dueDate, status) => {
  if (!dueDate) return null;
  if (status === "Missed") {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((today - due) / 86400000);
    if (days <= 0) return "Missed";
    return `Missed by ${days} day${days === 1 ? "" : "s"}`;
  }
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return `Missed by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
};

const reminderOffsetLabel = (r) => {
  if (r.reminderValue != null && r.reminderUnit != null) {
    const units = { 1: "minute", 2: "hour", 3: "day", 4: "week" };
    const unit = units[r.reminderUnit] || "day";
    const n = r.reminderValue;
    return `${n} ${unit}${n === 1 ? "" : "s"} before`;
  }
  if (r.reminderTypeName) return r.reminderTypeName;
  return "One-time";
};

const channelIcon = (name) => {
  const key = String(name || "")
    .toLowerCase()
    .replace(/\s+/g, "");
  return CHANNEL_ICON_MAP[key] || "ri-notification-3-line";
};

const buildMonthMatrix = (year, month) => {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({
      day: prevDays - startDow + i + 1,
      inMonth: false,
      date: new Date(year, month - 1, prevDays - startDow + i + 1),
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const n = cells.length - (startDow + daysInMonth) + 1;
    cells.push({
      day: n,
      inMonth: false,
      date: new Date(year, month + 1, n),
    });
  }
  return cells;
};

const toYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const MiniCalendar = ({ markedDates = [] }) => {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const cells = useMemo(
    () => buildMonthMatrix(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const markedSet = useMemo(() => new Set(markedDates.map((d) => String(d).slice(0, 10))), [markedDates]);

  const title = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="reminders-mini-cal">
      <div className="reminders-mini-cal-header">
        <strong>{title}</strong>
        <div className="reminders-mini-cal-nav">
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelected(today);
            }}
          >
            Today
          </button>
        </div>
      </div>
      <div className="reminders-mini-cal-grid headers">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="reminders-mini-cal-grid">
        {cells.map((c, idx) => {
          const ymd = toYmd(c.date);
          const isToday = ymd === toYmd(today);
          const isSelected = ymd === toYmd(selected);
          const hasMark = markedSet.has(ymd);
          return (
            <button
              type="button"
              key={`${ymd}-${idx}`}
              className={classnames("reminders-mini-cal-day", {
                muted: !c.inMonth,
                today: isToday,
                selected: isSelected && !isToday,
                marked: hasMark,
              })}
              onClick={() => setSelected(c.date)}
            >
              {c.day}
              {hasMark ? <span className="dot" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CalendarReminders = () => {
  document.title = "Reminders | Calendar";

  const {
    tab,
    setTab,
    summary,
    refreshSummary,
    masters,
    calendarId,
    setCalendarId,
    reminderTypeId,
    setReminderTypeId,
    channelId,
    setChannelId,
    clearDropdownFilters,
    buildReminderParams,
  } = useRemindersPage();

  const [rows, setRows] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [calendars, setCalendars] = useState([]);
  const [dayDots, setDayDots] = useState([]);

  useEffect(() => {
    getCalendars()
      .then((c) => setCalendars(Array.isArray(c) ? c : []))
      .catch(() => setCalendars([]));

    const now = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    getCalendarDayDots({
      fromDate: fromDate.toISOString().slice(0, 10),
      toDate: toDate.toISOString().slice(0, 10),
    })
      .then((dots) => {
        if (Array.isArray(dots)) {
          setDayDots(dots.map((d) => d.date).filter(Boolean));
        } else {
          setDayDots([]);
        }
      })
      .catch(() => setDayDots([]));

    getRemindersList({ tab: "upcoming", page: 1, pageSize: 5 })
      .then((data) => setUpcoming(data?.items || (Array.isArray(data) ? data : [])))
      .catch(() => setUpcoming([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildReminderParams({
        page,
        pageSize,
        search: search || undefined,
      });
      const data = await getRemindersList(params);
      setRows(data?.items || (Array.isArray(data) ? data : []));
      setTotalCount(data?.totalCount ?? data?.total ?? 0);
    } catch {
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, buildReminderParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, calendarId, reminderTypeId, channelId, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const applySearch = () => setSearch(searchInput.trim());

  const applyFilters = () => {
    setSearch(searchInput.trim());
    load();
    refreshSummary();
  };

  const tabCount = (t) => {
    if (!t.countKey) return null;
    const n = summary[t.countKey];
    return typeof n === "number" && n > 0 ? n : null;
  };

  const statusColor = (status) => {
    if (status === "Missed") return "danger";
    if (status === "Completed") return "success";
    return "primary";
  };

  return (
    <React.Fragment>
      <div className="page-content reminders-page">
        <Container fluid>
          <div className="reminders-page-header">
            <div>
              <h4 className="mb-0">Reminders</h4>
              <p className="subtitle">Manage all reminders and never miss what matters.</p>
            </div>
          </div>

          <Row className="g-3">
            <Col xl={9} lg={8}>
              <Card className="reminders-main-card border-0">
                <div className="reminders-tabs-row">
                  <Nav tabs className="nav-tabs-custom">
                    {REMINDER_TABS.map((t) => {
                      const count = tabCount(t);
                      return (
                        <NavItem key={t.key}>
                          <NavLink
                            className={classnames({ active: tab === t.key })}
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setTab(t.key);
                            }}
                          >
                            {t.label}
                            {count != null ? (
                              <span className="reminders-tab-count">({count})</span>
                            ) : null}
                          </NavLink>
                        </NavItem>
                      );
                    })}
                  </Nav>
                </div>

                <div className="reminders-toolbar-row">
                  <div className="reminders-search-wrap">
                    <i className="ri-search-line" />
                    <Input
                      placeholder="Search reminders..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applySearch()}
                    />
                  </div>
                  <div className="reminders-toolbar-filters">
                    <Input
                      type="select"
                      className="reminders-toolbar-select"
                      value={calendarId}
                      onChange={(e) => setCalendarId(e.target.value)}
                    >
                      <option value="">All Calendars</option>
                      {calendars.map((c) => (
                        <option key={c.calendarId} value={c.calendarId}>
                          {c.calendarName}
                        </option>
                      ))}
                    </Input>
                    <Input
                      type="select"
                      className="reminders-toolbar-select"
                      value={reminderTypeId}
                      onChange={(e) => setReminderTypeId(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {(masters?.reminderTypes || []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Input>
                    <Input
                      type="select"
                      className="reminders-toolbar-select"
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                    >
                      <option value="">All Channels</option>
                      {(masters?.notificationChannels || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Input>
                    <Button color="light" size="sm" onClick={applyFilters}>
                      <i className="ri-filter-3-line me-1" />
                      Filters
                    </Button>
                    <Button
                      color="light"
                      size="sm"
                      className="btn-icon"
                      onClick={() => {
                        load();
                        refreshSummary();
                      }}
                      title="Refresh"
                    >
                      <i className="ri-refresh-line" />
                    </Button>
                    {(calendarId || reminderTypeId || channelId) && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 border-0 text-primary"
                        onClick={clearDropdownFilters}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <CardBody className="p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table className="align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: 36 }}>
                                <Input type="checkbox" />
                              </th>
                              <th>Reminder</th>
                              <th>Item / Task</th>
                              <th>Due Date</th>
                              <th>Reminder Time</th>
                              <th>Channel</th>
                              <th>Status</th>
                              <th style={{ width: 48 }} />
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="text-center text-muted py-5">
                                  No reminders found.
                                </td>
                              </tr>
                            ) : (
                              rows.map((r) => {
                                const rel = relativeDueLabel(r.dueDate, r.status);
                                const time =
                                  formatTime(r.reminderTimeOfDay) ||
                                  (r.reminderDatetime
                                    ? formatTime(
                                        new Date(r.reminderDatetime).toTimeString()
                                      )
                                    : null);
                                return (
                                  <tr key={r.reminderId}>
                                    <td>
                                      <Input type="checkbox" />
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-start gap-2">
                                        <span
                                          className="reminders-row-icon"
                                          style={{
                                            background: `${r.calendarColor || "#556ee6"}22`,
                                            color: r.calendarColor || "#556ee6",
                                          }}
                                        >
                                          <i className="ri-notification-3-line" />
                                        </span>
                                        <div>
                                          <div className="fw-medium">
                                            {r.itemTitle || "Reminder"}
                                          </div>
                                          <small className="text-muted">
                                            {r.reminderTypeName || "One-time"}
                                          </small>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <Link
                                        to="/calendar-items"
                                        className="reminders-item-link"
                                      >
                                        {r.itemTitle || r.itemTypeName || "—"}
                                      </Link>
                                    </td>
                                    <td>
                                      <div>{formatDate(r.dueDate)}</div>
                                      {rel ? (
                                        <small
                                          className={classnames({
                                            "text-danger":
                                              r.status === "Missed" ||
                                              String(rel).startsWith("Missed") ||
                                              rel === "Tomorrow" ||
                                              rel === "Today",
                                            "text-muted":
                                              r.status !== "Missed" &&
                                              !String(rel).startsWith("Missed") &&
                                              rel !== "Tomorrow" &&
                                              rel !== "Today",
                                          })}
                                        >
                                          {rel}
                                        </small>
                                      ) : null}
                                    </td>
                                    <td>
                                      <div>{time || "—"}</div>
                                      <small className="text-muted">
                                        {reminderOffsetLabel(r)}
                                      </small>
                                    </td>
                                    <td>
                                      <div className="reminders-channel-icons">
                                        {(r.channelNames || []).length === 0 ? (
                                          <span className="text-muted">—</span>
                                        ) : (
                                          (r.channelNames || []).map((name) => (
                                            <span
                                              key={`${r.reminderId}-${name}`}
                                              className="reminders-ch-icon"
                                              title={name}
                                            >
                                              <i className={channelIcon(name)} />
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <Badge color={statusColor(r.status)} pill className="reminders-status-pill">
                                        {r.status || (r.isActive ? "Scheduled" : "Completed")}
                                      </Badge>
                                    </td>
                                    <td>
                                      <Button color="light" size="sm" className="btn-icon">
                                        <i className="ri-pencil-line" />
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </Table>
                      </div>

                      <div className="reminders-table-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <small className="text-muted">
                          {totalCount === 0
                            ? "Showing 0 reminders"
                            : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                                page * pageSize,
                                totalCount
                              )} of ${totalCount} reminders`}
                        </small>
                        <div className="d-flex align-items-center gap-2">
                          <Pagination className="mb-0">
                            <PaginationItem disabled={page <= 1}>
                              <PaginationLink
                                previous
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage((p) => Math.max(1, p - 1));
                                }}
                              />
                            </PaginationItem>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                              const p = i + 1;
                              return (
                                <PaginationItem active={p === page} key={p}>
                                  <PaginationLink
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPage(p);
                                    }}
                                  >
                                    {p}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            <PaginationItem disabled={page >= totalPages}>
                              <PaginationLink
                                next
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage((p) => Math.min(totalPages, p + 1));
                                }}
                              />
                            </PaginationItem>
                          </Pagination>
                          <span className="text-muted small">{pageSize} / page</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} lg={4} className="reminders-right-col d-none d-xl-block">
              <Card className="reminders-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Reminder Overview</h5>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      onClick={() => setTab("all")}
                    >
                      View all
                    </button>
                  </div>
                  <div className="reminders-overview-grid">
                    {OVERVIEW_CARDS.map((card) => (
                      <div className="reminders-overview-card" key={card.key}>
                        <span
                          className="reminders-overview-icon"
                          style={{ background: `${card.color}18`, color: card.color }}
                        >
                          <i className={card.icon} />
                        </span>
                        <div>
                          <div className="reminders-overview-value">
                            {summary[card.key] ?? 0}
                          </div>
                          <div className="reminders-overview-label">{card.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card className="reminders-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Upcoming Reminders</h5>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      onClick={() => setTab("upcoming")}
                    >
                      View all
                    </button>
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-muted small mb-0">No upcoming reminders.</p>
                  ) : (
                    upcoming.map((u, i) => {
                      const time =
                        formatTime(u.reminderTimeOfDay) ||
                        (u.reminderDatetime
                          ? formatTime(new Date(u.reminderDatetime).toTimeString())
                          : "—");
                      const rel = relativeDueLabel(u.dueDate, u.status) || formatDate(u.dueDate);
                      return (
                        <div className="reminders-upcoming-item" key={u.reminderId}>
                          <span
                            className="dot"
                            style={{
                              background: UPCOMING_DOT_COLORS[i % UPCOMING_DOT_COLORS.length],
                            }}
                          />
                          <div className="flex-grow-1">
                            <div className="title">{u.itemTitle || "Reminder"}</div>
                            <div className="sub">{rel}</div>
                          </div>
                          <div className="time">{time}</div>
                        </div>
                      );
                    })
                  )}
                </CardBody>
              </Card>

              <Card className="reminders-right-card border-0">
                <CardBody>
                  <MiniCalendar markedDates={dayDots} />
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CalendarReminders;
