import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  Container,
  Progress,
  Row,
  Spinner,
} from "reactstrap";
import { Link } from "react-router-dom";
import { getAssignmentSummary, getDashboard } from "../../../helpers/calendar_api";
import NewItemModal from "../components/NewItemModal";
import "./dashboard.css";

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(value);
  }
};

const formatTime = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return value.length >= 5 ? value.slice(0, 5) : value;
  }
  return String(value);
};

const formatRelativeDue = (dueDate) => {
  if (!dueDate) return "";
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  return `in ${diff} days`;
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const MiniCalendar = ({ monthDate = new Date() }) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday first
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
    <div className="dash-mini-cal">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0 fw-semibold">{monthLabel}</h6>
        <Link to="/apps-calendar" className="text-primary small">
          Open
        </Link>
      </div>
      <div className="dash-mini-cal-grid weekdays">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="dash-mini-cal-grid">
        {cells.map((d, i) => {
          const isToday =
            d &&
            today.getDate() === d &&
            today.getMonth() === month &&
            today.getFullYear() === year;
          return (
            <span key={i} className={isToday ? "day today" : "day"}>
              {d || ""}
            </span>
          );
        })}
      </div>
      <div className="dash-legend mt-3">
        <span><i style={{ background: "#E53935" }} /> Task</span>
        <span><i style={{ background: "#FB8C00" }} /> Payment</span>
        <span><i style={{ background: "#43A047" }} /> Meeting</span>
        <span><i style={{ background: "#1E88E5" }} /> Reminder</span>
        <span><i style={{ background: "#8E24AA" }} /> Personal</span>
      </div>
    </div>
  );
};

const CalendarDashboard = () => {
  document.title = "Dashboard | Calendar";

  const [data, setData] = useState(null);
  const [assignSummary, setAssignSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);

  const displayName = useMemo(() => {
    try {
      const auth = JSON.parse(sessionStorage.getItem("authUser") || "null");
      const name =
        auth?.displayName ||
        auth?.userName ||
        auth?.data?.user?.displayName ||
        "User";
      return String(name).split(" ")[0];
    } catch {
      return "User";
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, summary] = await Promise.all([
        getDashboard(),
        getAssignmentSummary().catch(() => ({})),
      ]);
      setData(res || {});
      setAssignSummary(summary || {});
    } catch (err) {
      const msg =
        err.status === 401
          ? "Session expired or not signed in. Please log out and sign in again with your Calendar account."
          : err.message || "Failed to load dashboard";
      setError(msg);
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats || {};
  const upcoming = data?.upcomingItems || [];
  const timeline = data?.todayTimeline || [];
  const team = data?.teamProgress || {
    overallPercent: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
  };
  const categories = data?.itemsByCategory || [];
  const overdue = data?.overdueItems || [];

  const assignmentCards = [
    { label: "Pending", value: assignSummary.pending ?? 0, color: "#FB8C00", bg: "#FFF3E0" },
    { label: "Completed", value: assignSummary.completed ?? 0, color: "#43A047", bg: "#E8F5E9" },
    { label: "Overdue", value: assignSummary.overdue ?? 0, color: "#E53935", bg: "#FFEBEE" },
    { label: "Waiting Approval", value: assignSummary.waitingApproval ?? 0, color: "#8E24AA", bg: "#F3E5F5" },
  ];

  const kpiCards = [
    { label: "Today's Items", value: stats.todayItems ?? 0, icon: "ri-calendar-event-line", color: "#405189", soft: "#E8EBFF" },
    { label: "Pending", value: stats.pending ?? 0, icon: "ri-time-line", color: "#F7B84B", soft: "#FFF4E1" },
    { label: "Completed Today", value: stats.completedToday ?? 0, icon: "ri-checkbox-circle-line", color: "#0AB39C", soft: "#E0F7F4" },
    { label: "Overdue", value: stats.overdue ?? 0, icon: "ri-alarm-warning-line", color: "#F06548", soft: "#FDE8E4" },
    { label: "This Week", value: stats.thisWeek ?? 0, icon: "ri-calendar-2-line", color: "#7C5CFC", soft: "#EEE8FF" },
    { label: "This Month", value: stats.thisMonth ?? 0, icon: "ri-calendar-check-line", color: "#299CDB", soft: "#E4F4FC" },
  ];

  const quickActions = [
    { label: "Add Reminder", icon: "ri-notification-3-line", color: "#1E88E5" },
    { label: "Add Task", icon: "ri-task-line", color: "#E53935" },
    { label: "Add Meeting", icon: "ri-group-line", color: "#43A047" },
    { label: "Add Payment", icon: "ri-money-dollar-circle-line", color: "#FB8C00" },
    { label: "Add Compliance", icon: "ri-shield-check-line", color: "#5E35B1" },
    { label: "Add Birthday", icon: "ri-cake-2-line", color: "#D81B60" },
    { label: "Add Appointment", icon: "ri-calendar-check-line", color: "#00897B" },
    { label: "More", icon: "ri-more-fill", color: "#74788D" },
  ];

  const openNew = () => {
    setModal(true);
  };

  return (
    <React.Fragment>
      <div className="page-content calendar-dashboard">
        <Container fluid>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
            <div>
              <h3 className="mb-1 fw-semibold text-dark">Dashboard</h3>
              <p className="text-muted mb-0">
                {greeting()}, {displayName}! Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <Button color="primary" className="btn-label" onClick={() => openNew()}>
              <i className="ri-add-line label-icon align-middle fs-16 me-2" />
              New Item
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner color="primary" />
            </div>
          ) : (
            <>
              {error ? <div className="alert alert-warning">{error}</div> : null}

              {/* KPI row */}
              <Row className="g-3 mb-3">
                {kpiCards.map((k) => (
                  <Col xl={2} md={4} sm={6} key={k.label}>
                    <Card className="dash-kpi-card border-0 shadow-sm h-100">
                      <CardBody className="d-flex align-items-center justify-content-between">
                        <div>
                          <p className="text-muted mb-1 small fw-medium">{k.label}</p>
                          <h3 className="mb-0 fw-bold" style={{ color: k.color }}>
                            {k.value}
                          </h3>
                        </div>
                        <div
                          className="dash-kpi-icon"
                          style={{ background: k.soft, color: k.color }}
                        >
                          <i className={k.icon} />
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Main grid: left (Upcoming + Timeline + bottom row) | right (Calendar → Assignments → Quick Actions) */}
              <Row className="g-3 dash-main-grid">
                <Col xl={8}>
                  <Row className="g-3">
                    <Col lg={6}>
                      <Card className="border-0 shadow-sm h-100 dash-panel-tall">
                        <CardHeader className="bg-white border-0 pb-0 d-flex align-items-center">
                          <h5 className="card-title mb-0 flex-grow-1">Upcoming Items</h5>
                          <Badge color="soft-primary" className="text-primary">
                            Next {Math.min(5, upcoming.length || 5)}
                          </Badge>
                        </CardHeader>
                        <CardBody>
                          {upcoming.length === 0 ? (
                            <p className="text-muted mb-0">No upcoming items.</p>
                          ) : (
                            <ul className="list-unstyled mb-0 dash-list">
                              {upcoming.slice(0, 5).map((item) => (
                                <li key={item.calendarItemId} className="dash-list-item">
                                  <span
                                    className="dash-dot"
                                    style={{
                                      background:
                                        item.priorityColor ||
                                        item.categoryColor ||
                                        "#556ee6",
                                    }}
                                  />
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1">{item.title}</h6>
                                    <small className="text-muted">
                                      {formatRelativeDue(item.dueDate)}
                                      {item.dueTime ? `, ${formatTime(item.dueTime)}` : ""}
                                    </small>
                                  </div>
                                  {item.priorityName ? (
                                    <Badge
                                      className="ms-2"
                                      style={{
                                        backgroundColor: item.priorityColor || "#74788D",
                                      }}
                                    >
                                      {item.priorityName}
                                    </Badge>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardBody>
                      </Card>
                    </Col>

                    <Col lg={6}>
                      <Card className="border-0 shadow-sm h-100 dash-panel-tall">
                        <CardHeader className="bg-white border-0 pb-0">
                          <h5 className="card-title mb-0">Today&apos;s Timeline</h5>
                        </CardHeader>
                        <CardBody>
                          {timeline.length === 0 ? (
                            <p className="text-muted mb-0">Nothing scheduled for today.</p>
                          ) : (
                            <ul className="list-unstyled mb-0 dash-timeline">
                              {timeline.map((t, idx) => (
                                <li key={idx}>
                                  <div className="time" style={{ color: t.itemTypeColor || "#405189" }}>
                                    {formatTime(t.startTime) || "--:--"}
                                  </div>
                                  <div className="content">
                                    <h6 className="mb-0">{t.title}</h6>
                                    <small className="text-muted">
                                      {t.subtitle || t.itemTypeName || ""}
                                    </small>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <CardHeader className="bg-white border-0 pb-0">
                          <h5 className="card-title mb-0">Team Progress</h5>
                        </CardHeader>
                        <CardBody>
                          <div className="d-flex align-items-center gap-3 flex-wrap">
                            <div className="dash-donut dash-donut-sm" style={{ "--p": `${Math.round(team.overallPercent || 0)}%` }}>
                              <div className="dash-donut-inner">
                                <strong>{Math.round(team.overallPercent || 0)}%</strong>
                                <small>Overall</small>
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <div className="dash-progress-row">
                                <span className="dot" style={{ background: "#0AB39C" }} />
                                <span className="flex-grow-1">Completed</span>
                                <strong>{team.completed ?? 0}</strong>
                              </div>
                              <div className="dash-progress-row">
                                <span className="dot" style={{ background: "#F7B84B" }} />
                                <span className="flex-grow-1">In Progress</span>
                                <strong>{team.inProgress ?? 0}</strong>
                              </div>
                              <div className="dash-progress-row">
                                <span className="dot" style={{ background: "#F06548" }} />
                                <span className="flex-grow-1">Pending</span>
                                <strong>{team.pending ?? 0}</strong>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <CardHeader className="bg-white border-0 pb-0">
                          <h5 className="card-title mb-0">Items by Category</h5>
                        </CardHeader>
                        <CardBody>
                          {categories.length === 0 ? (
                            <p className="text-muted mb-0">No category data.</p>
                          ) : (
                            categories.map((c, i) => (
                              <div key={i} className="mb-3">
                                <div className="d-flex justify-content-between mb-1">
                                  <span className="fw-medium small">
                                    <span
                                      className="d-inline-block rounded-circle me-2"
                                      style={{
                                        width: 10,
                                        height: 10,
                                        backgroundColor: c.color || "#405189",
                                      }}
                                    />
                                    {c.categoryName}
                                  </span>
                                  <Badge
                                    style={{
                                      backgroundColor: c.color || "#405189",
                                    }}
                                  >
                                    {c.count}
                                  </Badge>
                                </div>
                                <Progress
                                  value={Math.min(100, (c.count || 0) * 8)}
                                  style={{ height: 8 }}
                                  className="rounded-pill"
                                  barStyle={{
                                    backgroundColor: c.color || "#405189",
                                  }}
                                />
                              </div>
                            ))
                          )}
                        </CardBody>
                      </Card>
                    </Col>

                    <Col md={4}>
                      <Card className="border-0 shadow-sm h-100">
                        <CardHeader className="bg-white border-0 pb-0 d-flex align-items-center">
                          <h5 className="card-title mb-0 flex-grow-1">Overdue Items</h5>
                          <Badge color="danger" pill>
                            {overdue.length || stats.overdue || 0}
                          </Badge>
                        </CardHeader>
                        <CardBody>
                          {overdue.length === 0 ? (
                            <p className="text-muted mb-0">No overdue items.</p>
                          ) : (
                            <div className="d-flex flex-column gap-2">
                              {overdue.slice(0, 3).map((item) => (
                                <div className="dash-overdue-item dash-overdue-compact" key={item.calendarItemId}>
                                  <span className="icon">
                                    <i className="ri-error-warning-fill" />
                                  </span>
                                  <div className="flex-grow-1">
                                    <h6 className="mb-1 small">{item.title}</h6>
                                    <small className="text-danger">
                                      {formatRelativeDue(item.dueDate)}
                                    </small>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>
                </Col>

                <Col xl={4}>
                  <Card className="border-0 shadow-sm mb-3">
                    <CardBody>
                      <MiniCalendar />
                    </CardBody>
                  </Card>

                  <Card className="border-0 shadow-sm mb-3">
                    <CardHeader className="bg-white border-0 pb-0 d-flex align-items-center">
                      <h5 className="card-title mb-0 flex-grow-1">My Assignments</h5>
                      <Link to="/calendar-assignments" className="small">
                        View all
                      </Link>
                    </CardHeader>
                    <CardBody>
                      <Row className="g-2">
                        {assignmentCards.map((a) => (
                          <Col xs={6} key={a.label}>
                            <div
                              className="dash-assign-tile"
                              style={{ background: a.bg, borderColor: a.color }}
                            >
                              <div className="value" style={{ color: a.color }}>
                                {a.value}
                              </div>
                              <div className="label">{a.label}</div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </CardBody>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardHeader className="bg-white border-0 pb-0">
                      <h5 className="card-title mb-0">Quick Actions</h5>
                    </CardHeader>
                    <CardBody>
                      <div className="dash-quick-grid">
                        {quickActions.map((q) => (
                          <button
                            type="button"
                            key={q.label}
                            className="dash-quick-btn"
                            onClick={() => openNew()}
                          >
                            <span style={{ background: `${q.color}22`, color: q.color }}>
                              <i className={q.icon} />
                            </span>
                            <small>{q.label.replace("Add ", "")}</small>
                          </button>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>

      <NewItemModal
        isOpen={modal}
        toggle={() => setModal(!modal)}
        onCreated={() => load()}
      />
    </React.Fragment>
  );
};

export default CalendarDashboard;
