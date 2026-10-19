import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
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
} from "reactstrap";
import classnames from "classnames";
import { getActivityList, getCalendars } from "../../../helpers/calendar_api";
import {
  ACTIVITY_TABS,
  ACTIVITY_TYPE_FILTERS,
  useActivityPage,
} from "./ActivityPageContext";
import "./activity.css";

const SUMMARY_CARDS = [
  { key: "total", label: "Total Activities", icon: "ri-line-chart-line", color: "#556ee6" },
  { key: "updates", label: "Updates", icon: "ri-pencil-line", color: "#43A047" },
  { key: "assignments", label: "Assignments", icon: "ri-group-line", color: "#FB8C00" },
  { key: "completions", label: "Completions", icon: "ri-checkbox-circle-line", color: "#00ACC1" },
  { key: "comments", label: "Comments", icon: "ri-chat-3-line", color: "#8E24AA" },
  { key: "deletions", label: "Deletions", icon: "ri-delete-bin-line", color: "#E53935" },
];

const RECENT_DOT_COLORS = ["#556ee6", "#43A047", "#FB8C00", "#00ACC1", "#8E24AA"];

const typeStyle = (name = "") => {
  const n = String(name).toLowerCase();
  const found = ACTIVITY_TYPE_FILTERS.find((t) =>
    t.match?.some((m) => n.includes(m))
  );
  if (found) return found;
  if (n.includes("comment")) return { color: "#8E24AA", label: "Comment" };
  if (n.includes("remind")) return { color: "#7E57C2", label: "Reminder" };
  if (n.includes("attach") || n.includes("file"))
    return { color: "#3949AB", label: "Attachment" };
  return { color: "#556ee6", label: name || "Activity" };
};

const activityIcon = (name = "") => {
  const n = String(name).toLowerCase();
  if (n.includes("creat")) return "ri-file-add-line";
  if (n.includes("update")) return "ri-pencil-line";
  if (n.includes("assign")) return "ri-user-add-line";
  if (n.includes("complet")) return "ri-checkbox-circle-line";
  if (n.includes("delet")) return "ri-delete-bin-line";
  if (n.includes("comment")) return "ri-chat-3-line";
  if (n.includes("remind")) return "ri-notification-3-line";
  if (n.includes("attach")) return "ri-attachment-2";
  return "ri-history-line";
};

const tabBadge = (tab, activityName = "") => {
  const n = String(activityName).toLowerCase();
  if (tab === "assignments" || n.includes("assign"))
    return { label: "Assignment", color: "#FB8C00" };
  if (tab === "reminders" || n.includes("remind"))
    return { label: "Reminder", color: "#7E57C2" };
  if (tab === "attachments" || n.includes("attach") || n.includes("file"))
    return { label: "Attachment", color: "#3949AB" };
  if (tab === "comments" || n.includes("comment"))
    return { label: "Comment", color: "#8E24AA" };
  if (tab === "system") return { label: "System", color: "#878a99" };
  return { label: "Item", color: "#556ee6" };
};

const formatTime = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const formatDayHeader = (d) => {
  if (!d) return "Unknown";
  try {
    const date = new Date(d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((today - day) / 86400000);
    const label = date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (diff === 0) return `Today - ${label}`;
    if (diff === 1) return `Yesterday - ${label}`;
    return label;
  } catch {
    return String(d);
  }
};

const initials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const CalendarActivity = () => {
  document.title = "Activity | Calendar";

  const {
    tab,
    setTab,
    period,
    activityTypeKey,
    calendarId,
    setCalendarId,
    userId,
    setUserId,
    activityTypeId,
    setActivityTypeId,
    fromDate,
    toDate,
    masters,
    summary,
    topUsers,
    summaryPeriod,
    setSummaryPeriod,
    usersPeriod,
    setUsersPeriod,
    refreshMeta,
    refreshFilterCounts,
    clearDropdownFilters,
    buildActivityParams,
  } = useActivityPage();

  const [rows, setRows] = useState([]);
  const [recent, setRecent] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [calendars, setCalendars] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getCalendars()
      .then((c) => setCalendars(Array.isArray(c) ? c : []))
      .catch(() => setCalendars([]));

    getActivityList({ page: 1, pageSize: 5 })
      .then((data) => setRecent(data?.items || []))
      .catch(() => setRecent([]));
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildActivityParams({
        page,
        pageSize,
        search: search || undefined,
      });
      const data = await getActivityList(params);
      const list = data?.items || (Array.isArray(data) ? data : []);
      setRows(list);
      setTotalCount(data?.totalCount ?? 0);

      setUsers((prev) => {
        const map = new Map(prev.map((u) => [String(u.id), u]));
        list.forEach((r) => {
          if (r.createdBy && r.createdByName) {
            map.set(String(r.createdBy), { id: r.createdBy, name: r.createdByName });
          }
        });
        return Array.from(map.values());
      });
    } catch {
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, buildActivityParams]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [
    tab,
    period,
    activityTypeKey,
    calendarId,
    userId,
    activityTypeId,
    fromDate,
    toDate,
    search,
  ]);

  const grouped = useMemo(() => {
    const acc = {};
    rows.forEach((row) => {
      const key = formatDayHeader(row.createdOn);
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
    });
    return acc;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const maxUserCount = Math.max(1, ...topUsers.map((u) => u.activityCount || 0));

  const applySearch = () => setSearch(searchInput.trim());

  const applyFilters = () => {
    setSearch(searchInput.trim());
    loadRows();
    refreshMeta();
    refreshFilterCounts();
  };

  return (
    <React.Fragment>
      <div className="page-content activity-page">
        <Container fluid>
          <div className="activity-page-header">
            <div>
              <h4 className="mb-0">Activity</h4>
              <p className="subtitle">
                Track all actions and changes across your calendar.
              </p>
            </div>
            <div className="activity-header-actions">
              <Button color="light" size="sm">
                <i className="ri-download-2-line me-1" />
                Export
              </Button>
            </div>
          </div>

          <Row className="g-3">
            <Col xl={9} lg={8}>
              <Card className="activity-main-card border-0">
                <div className="activity-tabs-row">
                  <Nav tabs className="nav-tabs-custom">
                    {ACTIVITY_TABS.map((t) => (
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
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                </div>

                <div className="activity-toolbar-row">
                  <div className="activity-search-wrap">
                    <i className="ri-search-line" />
                    <Input
                      placeholder="Search activity..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applySearch()}
                    />
                  </div>
                  <div className="activity-toolbar-filters">
                    <Input
                      type="select"
                      className="activity-toolbar-select"
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
                      className="activity-toolbar-select"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    >
                      <option value="">All Users</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </Input>
                    <Input
                      type="select"
                      className="activity-toolbar-select"
                      value={activityTypeId}
                      onChange={(e) => setActivityTypeId(e.target.value)}
                    >
                      <option value="">All Activity Types</option>
                      {(masters?.activityTypes || []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
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
                        loadRows();
                        refreshMeta();
                        refreshFilterCounts();
                      }}
                      title="Refresh"
                    >
                      <i className="ri-refresh-line" />
                    </Button>
                    {(calendarId || userId || activityTypeId) && (
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
                  ) : rows.length === 0 ? (
                    <div className="text-center text-muted py-5">No activity found.</div>
                  ) : (
                    <div className="activity-feed">
                      {Object.entries(grouped).map(([day, items]) => (
                        <div key={day} className="activity-day-group">
                          <div className="activity-day-header">{day}</div>
                          {items.map((a) => {
                            const style = typeStyle(a.activityName);
                            const badge = tabBadge(tab, a.activityName);
                            return (
                              <div className="activity-feed-item" key={a.activityId}>
                                <div className="activity-feed-time">
                                  {formatTime(a.createdOn)}
                                </div>
                                <span
                                  className="activity-feed-icon"
                                  style={{
                                    background: `${style.color}18`,
                                    color: style.color,
                                  }}
                                >
                                  <i className={activityIcon(a.activityName)} />
                                </span>
                                <div className="activity-feed-body">
                                  <div className="activity-feed-text">
                                    <strong>{a.createdByName || "System"}</strong>{" "}
                                    <span className="text-muted">
                                      {a.activityMessage}
                                    </span>
                                  </div>
                                  <div className="activity-feed-meta">
                                    <span
                                      className="activity-pill"
                                      style={{
                                        background: `${badge.color}18`,
                                        color: badge.color,
                                      }}
                                    >
                                      {badge.label}
                                    </span>
                                    {a.itemTitle ? (
                                      <span className="activity-item-title">
                                        {a.itemTitle}
                                      </span>
                                    ) : null}
                                    {a.calendarName ? (
                                      <span
                                        className="activity-cal-chip"
                                        style={{
                                          background: `${a.calendarColor || "#556ee6"}18`,
                                          color: a.calendarColor || "#556ee6",
                                        }}
                                      >
                                        <i className="ri-calendar-line me-1" />
                                        {a.calendarName}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="activity-table-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <small className="text-muted">
                      {totalCount === 0
                        ? "Showing 0 activities"
                        : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                            page * pageSize,
                            totalCount
                          )} of ${totalCount} activities`}
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
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} lg={4} className="activity-right-col d-none d-xl-block">
              <Card className="activity-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Activity Summary</h5>
                    <Input
                      type="select"
                      bsSize="sm"
                      className="activity-period-select"
                      value={summaryPeriod}
                      onChange={(e) => setSummaryPeriod(e.target.value)}
                    >
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                    </Input>
                  </div>
                  <div className="activity-summary-grid">
                    {SUMMARY_CARDS.map((card) => (
                      <div className="activity-summary-card" key={card.key}>
                        <span
                          className="activity-summary-icon"
                          style={{ background: `${card.color}18`, color: card.color }}
                        >
                          <i className={card.icon} />
                        </span>
                        <div>
                          <div className="activity-summary-value">
                            {summary[card.key] ?? 0}
                          </div>
                          <div className="activity-summary-label">{card.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>

              <Card className="activity-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Recent Activities</h5>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0"
                      onClick={() => setTab("all")}
                    >
                      View all
                    </button>
                  </div>
                  {recent.length === 0 ? (
                    <p className="text-muted small mb-0">No recent activity.</p>
                  ) : (
                    recent.map((r, i) => (
                      <div className="activity-recent-item" key={r.activityId}>
                        <span
                          className="dot"
                          style={{
                            background: RECENT_DOT_COLORS[i % RECENT_DOT_COLORS.length],
                          }}
                        />
                        <span className="activity-avatar sm">
                          {initials(r.createdByName)}
                        </span>
                        <div className="flex-grow-1 min-w-0">
                          <div className="title text-truncate">
                            <strong>{r.createdByName || "System"}</strong>{" "}
                            {r.activityMessage}
                          </div>
                          <div className="sub text-truncate">
                            {r.itemTitle || r.activityName || "—"}
                          </div>
                        </div>
                        <div className="time">{formatTime(r.createdOn)}</div>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              <Card className="activity-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Top Active Users</h5>
                    <Input
                      type="select"
                      bsSize="sm"
                      className="activity-period-select"
                      value={usersPeriod}
                      onChange={(e) => setUsersPeriod(e.target.value)}
                    >
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                    </Input>
                  </div>
                  {topUsers.length === 0 ? (
                    <p className="text-muted small mb-0">No data</p>
                  ) : (
                    topUsers.map((u) => (
                      <div className="activity-user-row" key={u.userId}>
                        <span className="activity-avatar">
                          {initials(u.displayName)}
                        </span>
                        <div className="bar-wrap">
                          <div className="name">{u.displayName || `User #${u.userId}`}</div>
                          <div className="bar">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${Math.round(
                                  ((u.activityCount || 0) / maxUserCount) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="count">{u.activityCount ?? 0}</span>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default CalendarActivity;
