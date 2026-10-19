import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Nav,
  NavItem,
  NavLink,
  Offcanvas,
  OffcanvasBody,
  OffcanvasHeader,
  Row,
  Spinner,
  TabContent,
  TabPane,
} from "reactstrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import BootstrapTheme from "@fullcalendar/bootstrap";
import listPlugin from "@fullcalendar/list";
import classnames from "classnames";
import {
  getItem,
  getItemActivity,
  getItemAttachments,
  getItemReminders,
  getItems,
} from "../../../helpers/calendar_api";
import NewItemModal from "../components/NewItemModal";
import { useCalendarPage } from "./CalendarPageContext";
import "./calendar.css";

const VIEW_MAP = {
  day: "dayGridDay",
  week: "dayGridWeek",
  month: "dayGridMonth",
  agenda: "listWeek",
};

const LEGEND = [
  { label: "Task", color: "#E53935" },
  { label: "Meeting", color: "#43A047" },
  { label: "Payment", color: "#FB8C00" },
  { label: "Reminder", color: "#1E88E5" },
  { label: "Personal", color: "#8E24AA" },
  { label: "Birthday", color: "#D81B60" },
  { label: "Holiday", color: "#757575" },
];

const VIEW_TAB_COLORS = {
  day: "#1E88E5",
  week: "#8E24AA",
  month: "#405189",
  agenda: "#FB8C00",
};

const renderEventContent = (eventInfo) => {
  const color =
    eventInfo.event.extendedProps?.itemTypeColor ||
    eventInfo.event.borderColor ||
    "#405189";
  return (
    <div className="cal-event-bar" style={{ "--ev-color": color }}>
      <span className="cal-event-title">{eventInfo.event.title}</span>
    </div>
  );
};

const toDateStr = (d) => {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
};

const formatDisplayDate = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(value).slice(0, 10);
  }
};

const formatTime = (value) => {
  if (!value) return "";
  const t = String(value);
  return t.length >= 5 ? t.slice(0, 5) : t;
};

const DetailPanelBody = ({
  detail,
  detailLoading,
  reminders,
  attachments,
  activity,
  activeTab,
  setActiveTab,
  onClose,
}) => {
  const assigneeName =
    detail?.assignedToName || detail?.ownerName || detail?.createdByName || "Unassigned";

  return (
    <>
      <div className="detail-panel-top">
        <Nav tabs className="nav-tabs-custom nav-primary flex-grow-1">
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === "details" })}
              onClick={() => setActiveTab("details")}
              href="#"
            >
              Details
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === "activity" })}
              onClick={() => setActiveTab("activity")}
              href="#"
            >
              Activity {activity.length ? `(${activity.length})` : ""}
            </NavLink>
          </NavItem>
        </Nav>
        {detail ? (
          <Button color="light" size="sm" className="btn-icon detail-close-btn" onClick={onClose}>
            <i className="ri-close-line" />
          </Button>
        ) : null}
      </div>

      {detailLoading ? (
        <div className="text-center py-5">
          <Spinner color="primary" />
        </div>
      ) : !detail ? (
        <div className="detail-panel-empty">
          <i className="ri-calendar-event-line" />
          <p className="mb-0">Select an event on the calendar to view details.</p>
        </div>
      ) : (
        <TabContent activeTab={activeTab} className="detail-tab-content">
          <TabPane tabId="details">
            <div className="detail-title-row">
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span
                    className="cal-filter-dot"
                    style={{
                      background: detail.priorityColor || detail.itemTypeColor || "#E53935",
                    }}
                  />
                  <h5 className="mb-0">{detail.title}</h5>
                </div>
              </div>
              {detail.priorityName ? (
                <Badge
                  className="priority-badge"
                  style={{
                    color: detail.priorityColor || "#E53935",
                    backgroundColor: `${detail.priorityColor || "#E53935"}18`,
                  }}
                >
                  {detail.priorityName}
                </Badge>
              ) : null}
            </div>

            <div className="detail-meta-row">
              <i className="ri-calendar-line" />
              <div>{formatDisplayDate(detail.dueDate || detail.startDate)}</div>
            </div>
            <div className="detail-meta-row">
              <i className="ri-time-line" />
              <div>
                {formatTime(detail.startTime || detail.dueTime) || "—"}
                {detail.endTime ? ` – ${formatTime(detail.endTime)}` : ""}
                {detail.timezoneName ? (
                  <div className="text-muted small">{detail.timezoneName}</div>
                ) : null}
              </div>
            </div>
            {detail.recurrenceSummary ? (
              <div className="detail-meta-row">
                <i className="ri-repeat-line" />
                <div>{detail.recurrenceSummary}</div>
              </div>
            ) : null}
            <div className="detail-meta-row">
              <i className="ri-user-line" />
              <div>{detail.createdByName || assigneeName}</div>
            </div>
            {detail.categoryName ? (
              <div className="detail-meta-row">
                <i className="ri-folder-line" />
                <div>{detail.categoryName}</div>
              </div>
            ) : null}
            {detail.description ? (
              <div className="detail-meta-row">
                <i className="ri-align-left" />
                <div className="text-muted">{detail.description}</div>
              </div>
            ) : null}

            <div className="detail-section">
              <div className="detail-section-header">
                <h6>Reminders</h6>
                <button type="button" className="btn btn-link btn-sm p-0">
                  + Add
                </button>
              </div>
              {reminders.length === 0 ? (
                <p className="text-muted small mb-0">No reminders.</p>
              ) : (
                reminders.map((r) => (
                  <div className="detail-reminder-item" key={r.reminderId}>
                    <i className="ri-notification-3-line text-primary" />
                    <div className="flex-grow-1">
                      <div>{r.reminderTypeName || "Reminder"}</div>
                      {r.reminderDatetime ? (
                        <small className="text-muted">
                          {String(r.reminderDatetime).slice(0, 16).replace("T", " ")}
                        </small>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="detail-section">
              <div className="detail-section-header">
                <h6>Attachments {attachments.length ? `(${attachments.length})` : ""}</h6>
                <button type="button" className="btn btn-link btn-sm p-0">
                  + Add
                </button>
              </div>
              {attachments.length === 0 ? (
                <p className="text-muted small mb-0">No attachments.</p>
              ) : (
                attachments.map((a) => (
                  <div className="detail-attachment-item" key={a.attachmentId}>
                    <i className="ri-file-line text-danger" />
                    <div className="flex-grow-1 text-truncate">
                      <div>{a.originalFileName || a.fileName}</div>
                    </div>
                    <i className="ri-download-2-line text-muted" />
                  </div>
                ))
              )}
            </div>

            <div className="detail-section">
              <h6 className="mb-2">Assigned To</h6>
              <div className="detail-assignee">
                <span className="avatar">{assigneeName.charAt(0).toUpperCase()}</span>
                <div className="fw-medium">{assigneeName}</div>
              </div>
            </div>
          </TabPane>

          <TabPane tabId="activity">
            {activity.length === 0 ? (
              <p className="text-muted small mb-0">No activity yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {activity.map((a, idx) => (
                  <li key={a.activityId || idx} className="mb-2 small border-bottom pb-2">
                    <strong>{a.activityTypeName || a.action || "Update"}</strong>
                    {a.performedByName ? ` · ${a.performedByName}` : ""}
                    {a.createdOn ? (
                      <div className="text-muted">
                        {String(a.createdOn).slice(0, 16).replace("T", " ")}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </TabPane>
        </TabContent>
      )}
    </>
  );
};

const CalendarMainView = () => {
  document.title = "Calendar | Calendar";

  const calendarRef = useRef(null);
  const calendarHostRef = useRef(null);
  const [calHeight, setCalHeight] = useState(640);
  const {
    selectedCalIds,
    setMiniMonth,
    setSelectedDate,
    registerGoToDateHandler,
    usingDefaultCalendars,
  } = useCalendarPage();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("month");
  const [range, setRange] = useState({ fromDate: null, toDate: null });
  const [modal, setModal] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState("details");

  useEffect(() => {
    registerGoToDateHandler((date) => {
      calendarRef.current?.getApi()?.gotoDate(date);
    });
  }, [registerGoToDateHandler]);

  useEffect(() => {
    const updateHeight = () => {
      if (!calendarHostRef.current) return;
      const top = calendarHostRef.current.getBoundingClientRect().top;
      const bottomGap = 24;
      setCalHeight(Math.max(520, window.innerHeight - top - bottomGap));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    const t = window.setTimeout(updateHeight, 120);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.clearTimeout(t);
    };
  }, [loading, viewMode]);

  useEffect(() => {
    calendarRef.current?.getApi()?.updateSize();
  }, [calHeight]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, pageSize: 200 };
      if (range.fromDate) params.fromDate = range.fromDate;
      if (range.toDate) params.toDate = range.toDate;

      const res = await getItems(params);
      const items = res?.items || (Array.isArray(res) ? res : []) || [];

      const filtered = usingDefaultCalendars
        ? items
        : selectedCalIds.length === 0
          ? items
          : items.filter((i) => selectedCalIds.includes(i.calendarId));

      const mapped = filtered.map((item) => {
        const startDate = item.dueDate || item.startDate || item.createdOn;
        let start = startDate ? String(startDate).slice(0, 10) : toDateStr(new Date());
        if (item.dueTime && !item.isAllDay) {
          const t = String(item.dueTime).slice(0, 8);
          start = `${start}T${t}`;
        }
        return {
          id: String(item.calendarItemId),
          title: item.title,
          start,
          allDay: item.isAllDay !== false,
          backgroundColor: "transparent",
          borderColor:
            item.itemTypeColor || item.calendarColor || item.priorityColor || "#405189",
          extendedProps: { ...item },
        };
      });
      setEvents(mapped);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [range.fromDate, range.toDate, selectedCalIds, usingDefaultCalendars]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const changeView = (mode) => {
    setViewMode(mode);
    const api = calendarRef.current?.getApi?.();
    if (api && VIEW_MAP[mode]) {
      api.changeView(VIEW_MAP[mode]);
    }
  };

  const handleDatesSet = (arg) => {
    setRange({
      fromDate: toDateStr(arg.start),
      toDate: toDateStr(arg.end),
    });
    setMiniMonth(new Date(arg.view.currentStart));
    setSelectedDate(new Date(arg.view.currentStart));
  };

  const openDetail = async (itemId) => {
    setDetailLoading(true);
    setDetail(null);
    setReminders([]);
    setAttachments([]);
    setActivity([]);
    setDetailTab("details");
    if (window.innerWidth < 1200) {
      setMobileDrawer(true);
    }

    try {
      const [item, rem, att, act] = await Promise.all([
        getItem(itemId),
        getItemReminders(itemId).catch(() => []),
        getItemAttachments(itemId).catch(() => []),
        getItemActivity(itemId).catch(() => []),
      ]);
      setDetail(item);
      setReminders(Array.isArray(rem) ? rem : []);
      setAttachments(Array.isArray(att) ? att : []);
      setActivity(Array.isArray(act) ? act : []);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setReminders([]);
    setAttachments([]);
    setActivity([]);
    setMobileDrawer(false);
  };

  const detailPanel = (
    <DetailPanelBody
      detail={detail}
      detailLoading={detailLoading}
      reminders={reminders}
      attachments={attachments}
      activity={activity}
      activeTab={detailTab}
      setActiveTab={setDetailTab}
      onClose={closeDetail}
    />
  );

  return (
    <React.Fragment>
      <div className="page-content calendar-page">
        <Container fluid className="calendar-page-container">
          <Row className="g-3 calendar-layout">
            {/* Center — full calendar */}
            <Col xl={9} lg={8} className="calendar-center-col">
              <Card className="calendar-main-card border-0 h-100">
                <CardBody className="calendar-main-body">
                  <div className="calendar-toolbar">
                    <div className="calendar-view-tabs">
                      {["day", "week", "month", "agenda"].map((mode) => (
                        <Button
                          key={mode}
                          className={classnames("cal-view-btn", {
                            active: viewMode === mode,
                          })}
                          style={
                            viewMode === mode
                              ? { backgroundColor: VIEW_TAB_COLORS[mode], borderColor: VIEW_TAB_COLORS[mode] }
                              : undefined
                          }
                          color={viewMode === mode ? "primary" : "light"}
                          onClick={() => changeView(mode)}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <Button color="primary" className="cal-new-btn" onClick={() => setModal(true)}>
                      <i className="ri-add-line me-1" />
                      New Item
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-2 mb-2">
                      <Spinner size="sm" color="primary" className="me-2" />
                      Loading events…
                    </div>
                  ) : null}

                  <div className="calendar-fc-host" ref={calendarHostRef}>
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[BootstrapTheme, dayGridPlugin, interactionPlugin, listPlugin]}
                      initialView="dayGridMonth"
                      themeSystem="bootstrap"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "",
                      }}
                      events={events}
                      editable={false}
                      selectable
                      fixedWeekCount={false}
                      dayMaxEvents={4}
                      moreLinkClick="popover"
                      datesSet={handleDatesSet}
                      eventClick={(info) => openDetail(info.event.id)}
                      eventContent={renderEventContent}
                      height={calHeight}
                    />
                  </div>

                  <div className="cal-legend">
                    {LEGEND.map((l) => (
                      <span
                        key={l.label}
                        className="cal-legend-chip"
                        style={{ "--chip-color": l.color }}
                      >
                        <i style={{ background: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </Col>

            {/* Right menu — item details */}
            <Col xl={3} lg={4} className="d-none d-lg-block calendar-right-col">
              <Card className="calendar-detail-card border-0 h-100">
                <CardBody>{detailPanel}</CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <Offcanvas
        direction="end"
        isOpen={mobileDrawer}
        toggle={closeDetail}
        className="d-lg-none"
        style={{ width: 360 }}
      >
        <OffcanvasHeader toggle={closeDetail}>Item Details</OffcanvasHeader>
        <OffcanvasBody>{detailPanel}</OffcanvasBody>
      </Offcanvas>

      <NewItemModal
        isOpen={modal}
        toggle={() => setModal(!modal)}
        onCreated={() => loadEvents()}
      />
    </React.Fragment>
  );
};

export default CalendarMainView;
