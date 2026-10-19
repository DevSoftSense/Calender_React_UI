import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  Container,
  Input,
  Nav,
  NavItem,
  NavLink,
  Pagination,
  PaginationItem,
  PaginationLink,
  Spinner,
  Table,
} from "reactstrap";
import classnames from "classnames";
import { getCalendars, getItems } from "../../../helpers/calendar_api";
import NewItemModal from "../components/NewItemModal";
import { ITEM_TAB_KEYS, useItemsPage } from "./ItemsPageContext";
import "./items.css";

const CalendarItems = () => {
  document.title = "Items | Calendar";

  const {
    tab,
    setTab,
    counts,
    refreshCounts,
    masters,
    calendarId,
    setCalendarId,
    priorityId,
    setPriorityId,
    assigneeUserId,
    setAssigneeUserId,
    clearDropdownFilters,
    buildItemParams,
  } = useItemsPage();

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [calendars, setCalendars] = useState([]);
  const [modal, setModal] = useState(false);

  useEffect(() => {
    getCalendars()
      .then((c) => setCalendars(Array.isArray(c) ? c : []))
      .catch(() => setCalendars([]));
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildItemParams({
        page,
        pageSize,
        search: search || undefined,
      });
      const res = await getItems(params);
      setItems(res?.items || []);
      setTotalCount(res?.totalCount ?? 0);
    } catch {
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, buildItemParams]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    setPage(1);
  }, [tab, calendarId, priorityId, assigneeUserId, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const applySearch = () => setSearch(searchInput.trim());

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
    if (!t) return "—";
    const s = String(t);
    return s.length >= 5 ? s.slice(0, 5) : s;
  };

  const tabLabel = (key) => {
    if (key === "all") return "All";
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <React.Fragment>
      <div className="page-content items-page">
        <Container fluid>
          <div className="items-page-header">
            <div>
              <h4 className="mb-0">Items</h4>
              <p className="subtitle">
                Manage all your tasks, reminders, meetings and important items
              </p>
            </div>
            <div className="items-header-actions">
              <Button color="light" size="sm">
                <i className="ri-filter-3-line me-1" />
                Filters
              </Button>
              <Button color="light" size="sm">
                Group by: None
              </Button>
              <Button color="light" size="sm">
                Sort by: Due Date
              </Button>
              <Button color="primary" size="sm" onClick={() => setModal(true)}>
                <i className="ri-add-line me-1" />
                New Item
              </Button>
            </div>
          </div>

          <Card className="items-table-card border-0">
            <div className="items-tabs-row px-3 pt-2">
              <Nav tabs className="nav-tabs-custom">
                {ITEM_TAB_KEYS.map((t) => (
                  <NavItem key={t}>
                    <NavLink
                      className={classnames({ active: tab === t })}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setTab(t);
                      }}
                    >
                      {tabLabel(t)}
                    </NavLink>
                  </NavItem>
                ))}
              </Nav>
            </div>

            <div className="items-toolbar-row px-3">
              <div className="items-search-wrap">
                <i className="ri-search-line" />
                <Input
                  placeholder="Search items…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                />
              </div>
              <div className="items-toolbar-filters">
                <Input
                  type="select"
                  className="items-toolbar-select"
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
                  className="items-toolbar-select"
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
                  className="items-toolbar-select"
                  value={assigneeUserId}
                  onChange={(e) => setAssigneeUserId(e.target.value)}
                >
                  <option value="">All Assignees</option>
                </Input>
                <button
                  type="button"
                  className="items-clear-link btn btn-link p-0 border-0"
                  onClick={clearDropdownFilters}
                >
                  Clear
                </button>
              </div>
            </div>

            <CardBody>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner color="primary" />
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>
                            <Input type="checkbox" />
                          </th>
                          <th>Title</th>
                          <th>Calendar</th>
                          <th>Due Date</th>
                          <th>Time</th>
                          <th>Assignee</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created On</th>
                          <th style={{ width: 48 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center text-muted py-5">
                              No items found.
                            </td>
                          </tr>
                        ) : (
                          items.map((item) => (
                            <tr key={item.calendarItemId}>
                              <td>
                                <Input type="checkbox" />
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span
                                    className="item-title-dot"
                                    style={{
                                      background:
                                        item.priorityColor ||
                                        item.itemTypeColor ||
                                        "#556ee6",
                                    }}
                                  />
                                  <div>
                                    <h6 className="mb-0 fw-medium">{item.title}</h6>
                                    {item.isRecurring ? (
                                      <Badge color="soft-info" className="mt-1">
                                        Recurring
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span
                                  className="calendar-tag"
                                  style={{
                                    "--tag-color":
                                      item.categoryColor ||
                                      item.calendarColor ||
                                      "#556ee6",
                                  }}
                                >
                                  {item.categoryName || item.calendarName || "—"}
                                </span>
                              </td>
                              <td>{formatDate(item.dueDate)}</td>
                              <td>{formatTime(item.dueTime)}</td>
                              <td>{item.assigneeName || item.assigneeInitials || "—"}</td>
                              <td>
                                <Badge
                                  style={{
                                    backgroundColor: item.priorityColor || "#878a99",
                                  }}
                                >
                                  {item.priorityName || "—"}
                                </Badge>
                              </td>
                              <td>
                                <Badge
                                  style={{
                                    backgroundColor: item.statusColor || "#556ee6",
                                  }}
                                >
                                  {item.statusName || "—"}
                                </Badge>
                              </td>
                              <td>{formatDate(item.createdOn)}</td>
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

                  <div className="table-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <small className="text-muted">
                      Showing {(page - 1) * pageSize + 1} to{" "}
                      {Math.min(page * pageSize, totalCount)} of {totalCount} items
                    </small>
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
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>

      <Button
        color="primary"
        className="btn-icon rounded-circle items-fab"
        onClick={() => setModal(true)}
        title="New Item"
      >
        <i className="ri-add-line fs-20" />
      </Button>

      <NewItemModal
        isOpen={modal}
        toggle={() => setModal(!modal)}
        onCreated={() => {
          loadItems();
          refreshCounts();
        }}
      />
    </React.Fragment>
  );
};

export default CalendarItems;
