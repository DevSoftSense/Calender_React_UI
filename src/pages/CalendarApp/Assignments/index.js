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
  Row,
  Spinner,
  Table,
} from "reactstrap";
import classnames from "classnames";
import { Link } from "react-router-dom";
import {
  getAssignments,
  getCalendars,
  getMasters,
  getTopAssignees,
  getUpcomingDeadlines,
} from "../../../helpers/calendar_api";
import {
  ASSIGNMENT_STATUS_FILTERS,
  ASSIGNMENT_VIEWS,
  useAssignmentsPage,
} from "./AssignmentsPageContext";
import "./assignments.css";

const buildDonutBackground = (segments, total) => {
  if (!total) return "#eef0f7";
  let acc = 0;
  return segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = acc;
      acc += (s.value / total) * 100;
      return `${s.color} ${start}% ${acc}%`;
    })
    .join(", ");
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

const AssignmentDonutSummary = ({ summary }) => {
  const segments = useMemo(
    () =>
      ASSIGNMENT_STATUS_FILTERS.map((s) => ({
        label: s.label,
        color: s.color,
        value: summary[s.summaryKey] ?? 0,
      })),
    [summary]
  );

  const total = summary.total ?? segments.reduce((a, s) => a + s.value, 0);

  return (
    <Card className="assign-right-card border-0">
      <CardBody>
        <h5 className="card-title">Assignment Summary</h5>
        <div className="assign-donut-wrap">
          <div
            className="assign-donut"
            style={{ background: `conic-gradient(${buildDonutBackground(segments, total)})` }}
          >
            <div className="assign-donut-inner">
              <strong>{total}</strong>
              <small>Total</small>
            </div>
          </div>
          <div className="assign-donut-legend">
            {segments.map((s) => {
              const pct = total ? Math.round((s.value / total) * 100) : 0;
              return (
                <div className="assign-legend-row" key={s.label}>
                  <span className="dot" style={{ background: s.color }} />
                  <span className="label">{s.label}</span>
                  <span className="meta">
                    {s.value} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

const CalendarAssignments = () => {
  document.title = "Assignments | Calendar";

  const {
    view,
    setView,
    summary,
    statusFilter,
    priorityId,
    setPriorityId,
    calendarId,
    setCalendarId,
    statusId,
    setStatusId,
    clearDropdownFilters,
  } = useAssignmentsPage();

  const [rows, setRows] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [topAssignees, setTopAssignees] = useState([]);
  const [masters, setMasters] = useState(null);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    Promise.all([
      getMasters().catch(() => ({})),
      getCalendars().catch(() => []),
      getUpcomingDeadlines({ limit: 5 }).catch(() => []),
      getTopAssignees({ limit: 5 }).catch(() => []),
    ]).then(([m, c, u, t]) => {
      setMasters(m || {});
      setCalendars(Array.isArray(c) ? c : []);
      setUpcoming(Array.isArray(u) ? u : []);
      setTopAssignees(Array.isArray(t) ? t : []);
    });
  }, []);

  const resolveStatusId = useCallback(
    (filterKey) => {
      if (!filterKey || !masters?.statuses) return undefined;
      const map = {
        pending: ["pending"],
        in_progress: ["in progress"],
        completed: ["completed", "done"],
        overdue: ["overdue"],
        waiting_approval: ["waiting approval"],
      };
      const names = map[filterKey] || [];
      const found = masters.statuses.find((s) =>
        names.some((n) => String(s.name).toLowerCase().includes(n))
      );
      return found?.id;
    },
    [masters]
  );

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        view,
        search: search || undefined,
        priorityId: priorityId || undefined,
        calendarId: calendarId || undefined,
        statusId: statusId || resolveStatusId(statusFilter) || undefined,
        pageSize: 50,
      };
      if (statusFilter === "waiting_approval") {
        params.view = "waiting_approval";
      }
      const data = await getAssignments(params);
      let list = Array.isArray(data) ? data : data?.items || [];
      if (statusFilter === "overdue") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        list = list.filter((r) => {
          if (!r.dueDate) return false;
          const due = new Date(r.dueDate);
          due.setHours(0, 0, 0, 0);
          return due < today;
        });
      }
      setRows(list);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [view, search, priorityId, calendarId, statusId, statusFilter, resolveStatusId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (statusFilter === "waiting_approval") {
      setView("waiting_approval");
    }
  }, [statusFilter, setView]);

  const maxAssigneeCount = useMemo(
    () => Math.max(1, ...topAssignees.map((a) => a.taskCount || 0)),
    [topAssignees]
  );

  const kpiCards = ASSIGNMENT_STATUS_FILTERS.map((s) => ({
    ...s,
    value: summary[s.summaryKey] ?? 0,
  }));

  return (
    <React.Fragment>
      <div className="page-content assignments-page">
        <Container fluid>
          <div className="assignments-page-header">
            <div>
              <h4 className="mb-0">Assignments</h4>
              <p className="subtitle">
                Track and manage all task assignments across your team
              </p>
            </div>
            <div className="assignments-header-actions">
              <Button color="light" size="sm">
                <i className="ri-download-2-line me-1" />
                Export
              </Button>
              <Button color="primary" size="sm" tag={Link} to="/calendar-items">
                <i className="ri-add-line me-1" />
                Assign Item
              </Button>
            </div>
          </div>

          <Row className="g-3">
            <Col xl={9} lg={8}>
              <Card className="assign-main-card border-0">
                <div className="assign-tabs-row">
                  <Nav tabs className="nav-tabs-custom">
                    {ASSIGNMENT_VIEWS.map((v) => (
                      <NavItem key={v.key}>
                        <NavLink
                          className={classnames({ active: view === v.key })}
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setView(v.key);
                          }}
                        >
                          {v.label}
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                </div>

                <div className="assign-toolbar-row">
                  <div className="assign-search-wrap">
                    <i className="ri-search-line" />
                    <Input
                      placeholder="Search assignments…"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput.trim())}
                    />
                  </div>
                  <div className="assign-toolbar-filters">
                    <Input
                      type="select"
                      className="assign-toolbar-select"
                      value={statusId}
                      onChange={(e) => setStatusId(e.target.value)}
                    >
                      <option value="">All Status</option>
                      {(masters?.statuses || []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Input>
                    <Input
                      type="select"
                      className="assign-toolbar-select"
                      value={priorityId}
                      onChange={(e) => setPriorityId(e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      {(masters?.priorities || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Input>
                    <Input
                      type="select"
                      className="assign-toolbar-select"
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
                    <Button color="light" size="sm" className="btn-icon">
                      <i className="ri-filter-3-line" />
                    </Button>
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 border-0 text-primary"
                      onClick={clearDropdownFilters}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="assign-kpi-row">
                  {kpiCards.map((k) => (
                    <div
                      key={k.key}
                      className="assign-kpi-card"
                      style={{
                        background: `${k.color}12`,
                        borderColor: `${k.color}40`,
                        color: k.color,
                      }}
                    >
                      <div>
                        <div className="kpi-value">{k.value}</div>
                        <div className="kpi-label">{k.label}</div>
                      </div>
                      <i className={`kpi-icon ${k.icon}`} />
                    </div>
                  ))}
                </div>

                <CardBody className="p-0">
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner color="primary" />
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table className="align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: 36 }}>
                              <Input type="checkbox" />
                            </th>
                            <th>Title</th>
                            <th>Assigned To</th>
                            <th>Assigned By</th>
                            <th>Due Date</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created On</th>
                            <th style={{ width: 48 }} />
                          </tr>
                        </thead>
                        <tbody>
                          {rows.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center text-muted py-5">
                                No assignments found.
                              </td>
                            </tr>
                          ) : (
                            rows.map((r) => (
                              <tr key={r.assignmentId}>
                                <td>
                                  <Input type="checkbox" />
                                </td>
                                <td>
                                  <h6 className="mb-0 fw-medium">{r.title}</h6>
                                </td>
                                <td>{r.assignedToName || "—"}</td>
                                <td>
                                  {r.assignedByName || "—"}
                                  {r.assignedByRole ? (
                                    <small className="text-muted d-block">
                                      {r.assignedByRole}
                                    </small>
                                  ) : null}
                                </td>
                                <td>{formatDate(r.dueDate)}</td>
                                <td>
                                  <Badge
                                    style={{
                                      backgroundColor: r.priorityColor || "#878a99",
                                    }}
                                  >
                                    {r.priorityName || "—"}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge
                                    style={{
                                      backgroundColor: r.statusColor || "#556ee6",
                                    }}
                                  >
                                    {r.statusName || "—"}
                                  </Badge>
                                </td>
                                <td>{formatDate(r.createdOn)}</td>
                                <td>
                                  <Button color="light" size="sm" className="btn-icon">
                                    <i className="ri-more-fill" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>

            <Col xl={3} lg={4} className="assign-right-col d-none d-xl-block">
              <AssignmentDonutSummary summary={summary} />

              <Card className="assign-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Upcoming Deadlines</h5>
                    <Link to="/calendar-assignments" className="small">
                      View all
                    </Link>
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-muted small mb-0">No upcoming deadlines.</p>
                  ) : (
                    upcoming.map((u) => (
                      <div className="assign-deadline-item" key={u.assignmentId}>
                        <span
                          className="dot"
                          style={{
                            background:
                              u.daysRemaining <= 1 ? "#E53935" : "#FB8C00",
                          }}
                        />
                        <div className="flex-grow-1">
                          <div className="title">{u.title}</div>
                          <div className="sub">{u.calendarName || "—"}</div>
                        </div>
                        <div className="due">
                          <div className="due-date">{formatDate(u.dueDate)}</div>
                          <div
                            className="due-rel"
                            style={{
                              color: u.daysRemaining <= 1 ? "#E53935" : "#878a99",
                            }}
                          >
                            {u.daysRemaining === 0
                              ? "Today"
                              : u.daysRemaining === 1
                                ? "Tomorrow"
                                : u.daysRemaining < 0
                                  ? `${Math.abs(u.daysRemaining)} days overdue`
                                  : `${u.daysRemaining} days left`}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              <Card className="assign-right-card border-0">
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">Top Assignees</h5>
                    <Link to="/calendar-assignments" className="small">
                      View all
                    </Link>
                  </div>
                  {topAssignees.length === 0 ? (
                    <p className="text-muted small mb-0">No assignee data yet.</p>
                  ) : (
                    topAssignees.map((a) => (
                      <div className="assign-assignee-row" key={a.userId}>
                        <span className="avatar">
                          {(a.initials || a.displayName || "?").charAt(0).toUpperCase()}
                        </span>
                        <div className="bar-wrap">
                          <div className="name">{a.displayName || "User"}</div>
                          <div className="bar">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${Math.round(((a.taskCount || 0) / maxAssigneeCount) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="count">{a.taskCount ?? 0}</span>
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

export default CalendarAssignments;
