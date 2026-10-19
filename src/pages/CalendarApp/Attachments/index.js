import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Col,
  Container,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
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
import {
  getAttachmentDownloadUrl,
  getAttachmentsList,
  getCalendars,
  getItemActivity,
  getItems,
  uploadAttachment,
} from "../../../helpers/calendar_api";
import {
  ATTACHMENT_TABS,
  formatBytes,
  useAttachmentsPage,
} from "./AttachmentsPageContext";
import "./attachments.css";

const fileMeta = (name = "", ext = "") => {
  const e = String(ext || name.split(".").pop() || "")
    .toLowerCase()
    .replace(".", "");
  if (["pdf"].includes(e))
    return { label: "PDF", icon: "ri-file-pdf-2-fill", color: "#E53935", bg: "#FFEBEE" };
  if (["xls", "xlsx", "csv"].includes(e))
    return { label: "Excel", icon: "ri-file-excel-2-fill", color: "#43A047", bg: "#E8F5E9" };
  if (["doc", "docx"].includes(e))
    return { label: "Word", icon: "ri-file-word-2-fill", color: "#1E88E5", bg: "#E3F2FD" };
  if (["ppt", "pptx"].includes(e))
    return { label: "PPTX", icon: "ri-file-ppt-2-fill", color: "#FB8C00", bg: "#FFF3E0" };
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(e))
    return { label: "Image", icon: "ri-image-fill", color: "#8E24AA", bg: "#F3E5F5" };
  return { label: e ? e.toUpperCase() : "File", icon: "ri-file-line", color: "#556ee6", bg: "#EEF1FF" };
};

const formatDateTime = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
};

const initials = (name) => {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
};

const CalendarAttachments = () => {
  document.title = "Attachments | Calendar";

  const {
    tab,
    setTab,
    stats,
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
  } = useAttachmentsPage();

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [calendars, setCalendars] = useState([]);
  const [uploaders, setUploaders] = useState([]);
  const [activity, setActivity] = useState([]);
  const [comment, setComment] = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadItemId, setUploadItemId] = useState("");
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getCalendars()
      .then((c) => setCalendars(Array.isArray(c) ? c : []))
      .catch(() => setCalendars([]));
    getItems({ page: 1, pageSize: 100 })
      .then((res) => setItems(res?.items || (Array.isArray(res) ? res : [])))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (uploadTrigger > 0) {
      setUploadOpen(true);
    }
  }, [uploadTrigger]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = buildAttachmentParams({
        page,
        pageSize,
        search: search || undefined,
      });
      const data = await getAttachmentsList(params);
      const list = data?.items || (Array.isArray(data) ? data : []);
      setRows(list);
      setTotalCount(data?.totalCount ?? list.length);

      setUploaders((prev) => {
        const map = new Map(prev.map((u) => [String(u.id), u]));
        list.forEach((r) => {
          if (r.uploadedBy && r.uploadedByName) {
            map.set(String(r.uploadedBy), {
              id: r.uploadedBy,
              name: r.uploadedByName,
            });
          }
        });
        return Array.from(map.values());
      });

      if (selectedId && !list.some((r) => r.attachmentId === selectedId)) {
        // keep selection if still valid elsewhere; otherwise clear when empty page
      }
    } catch {
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, buildAttachmentParams, selectedId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    setPage(1);
  }, [tab, calendarId, attachmentTypeId, uploadedBy, search]);

  const selected = useMemo(
    () => rows.find((r) => r.attachmentId === selectedId) || null,
    [rows, selectedId]
  );

  useEffect(() => {
    if (!selected?.calendarItemId) {
      setActivity([]);
      return;
    }
    getItemActivity(selected.calendarItemId)
      .then((a) => setActivity(Array.isArray(a) ? a.slice(0, 5) : []))
      .catch(() => setActivity([]));
  }, [selected?.calendarItemId]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const applySearch = () => setSearch(searchInput.trim());

  const applyFilters = () => {
    setSearch(searchInput.trim());
    loadRows();
    refreshMeta();
  };

  const tabCount = (t) => {
    const n = stats[t.countKey];
    return typeof n === "number" ? n : 0;
  };

  const doUpload = async () => {
    if (!uploadFile || !uploadItemId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("calendarItemId", uploadItemId);
      fd.append("file", uploadFile);
      if (attachmentTypeId) fd.append("attachmentTypeId", attachmentTypeId);
      await uploadAttachment(fd);
      setUploadOpen(false);
      setUploadFile(null);
      setUploadItemId("");
      await Promise.all([loadRows(), refreshMeta()]);
    } catch {
      /* ignore – keep modal open */
    } finally {
      setUploading(false);
    }
  };

  const selectedMeta = selected
    ? fileMeta(selected.originalFileName || selected.fileName, selected.fileExtension)
    : null;

  return (
    <React.Fragment>
      <div className="page-content attachments-page">
        <Container fluid>
          <div className="attachments-page-header">
            <div>
              <h4 className="mb-0">Attachments</h4>
              <p className="subtitle">
                Store and manage all files related to your calendar items.
              </p>
            </div>
            <div className="attachments-header-actions">
              <Button color="light" size="sm">
                <i className="ri-download-2-line me-1" />
                Export
              </Button>
            </div>
          </div>

          <Row className="g-3">
            <Col xl={selected ? 8 : 12} lg={selected ? 7 : 12}>
              <Card className="attachments-main-card border-0">
                <div className="attachments-tabs-row">
                  <Nav tabs className="nav-tabs-custom">
                    {ATTACHMENT_TABS.map((t) => (
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
                          <span className="attachments-tab-count">
                            {tabCount(t)}
                          </span>
                        </NavLink>
                      </NavItem>
                    ))}
                  </Nav>
                </div>

                <div className="attachments-toolbar-row">
                  <div className="attachments-search-wrap">
                    <i className="ri-search-line" />
                    <Input
                      placeholder="Search attachments..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applySearch()}
                    />
                  </div>
                  <div className="attachments-toolbar-filters">
                    <Input
                      type="select"
                      className="attachments-toolbar-select"
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
                      className="attachments-toolbar-select"
                      value={attachmentTypeId}
                      onChange={(e) => setAttachmentTypeId(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {(masters?.attachmentTypes || []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Input>
                    <Input
                      type="select"
                      className="attachments-toolbar-select"
                      value={uploadedBy}
                      onChange={(e) => setUploadedBy(e.target.value)}
                    >
                      <option value="">All Uploaded By</option>
                      {uploaders.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
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
                      }}
                      title="Refresh"
                    >
                      <i className="ri-refresh-line" />
                    </Button>
                    {(calendarId || attachmentTypeId || uploadedBy) && (
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
                              <th>File Name</th>
                              <th>Related Item / Task</th>
                              <th>Type</th>
                              <th>Size</th>
                              <th>Uploaded By</th>
                              <th>Uploaded On</th>
                              <th style={{ width: 90 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="text-center text-muted py-5">
                                  No attachments found.
                                </td>
                              </tr>
                            ) : (
                              rows.map((r) => {
                                const meta = fileMeta(
                                  r.originalFileName || r.fileName,
                                  r.fileExtension
                                );
                                const active = selectedId === r.attachmentId;
                                return (
                                  <tr
                                    key={r.attachmentId}
                                    className={classnames("attachments-row", { active })}
                                    onClick={() => setSelectedId(r.attachmentId)}
                                    style={{ cursor: "pointer" }}
                                  >
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <Input type="checkbox" />
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        <span
                                          className="attachments-file-icon"
                                          style={{ background: meta.bg, color: meta.color }}
                                        >
                                          <i className={meta.icon} />
                                        </span>
                                        <span className="fw-medium">
                                          {r.originalFileName || r.fileName}
                                        </span>
                                      </div>
                                    </td>
                                    <td>
                                      {r.itemTitle ? (
                                        <span
                                          className="attachments-item-chip"
                                          style={{
                                            background: `${r.calendarColor || "#556ee6"}18`,
                                            color: r.calendarColor || "#556ee6",
                                          }}
                                        >
                                          {r.itemTitle}
                                        </span>
                                      ) : (
                                        <span className="text-muted">—</span>
                                      )}
                                    </td>
                                    <td>{meta.label}</td>
                                    <td>{formatBytes(r.fileSize)}</td>
                                    <td>
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="attachments-avatar">
                                          {initials(r.uploadedByName)}
                                        </span>
                                        <span>{r.uploadedByName || "—"}</span>
                                      </div>
                                    </td>
                                    <td>{formatDateTime(r.createdOn)}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <div className="d-flex gap-1">
                                        <Button
                                          color="light"
                                          size="sm"
                                          className="btn-icon"
                                          onClick={() => setSelectedId(r.attachmentId)}
                                          title="View"
                                        >
                                          <i className="ri-eye-line" />
                                        </Button>
                                        <Button
                                          color="light"
                                          size="sm"
                                          className="btn-icon"
                                          tag="a"
                                          href={getAttachmentDownloadUrl(r.attachmentId)}
                                          target="_blank"
                                          rel="noreferrer"
                                          title="Download"
                                        >
                                          <i className="ri-download-2-line" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </Table>
                      </div>

                      <div className="attachments-table-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <small className="text-muted">
                          {totalCount === 0
                            ? "Showing 0 attachments"
                            : `Showing ${(page - 1) * pageSize + 1} to ${Math.min(
                                page * pageSize,
                                totalCount
                              )} of ${totalCount} attachments`}
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

            {selected && selectedMeta ? (
              <Col xl={4} lg={5} className="attachments-right-col">
                <Card className="attachments-detail-card border-0">
                  <CardBody>
                    <div className="attachments-detail-header">
                      <h5 className="mb-0 text-truncate" title={selected.originalFileName || selected.fileName}>
                        {selected.originalFileName || selected.fileName}
                      </h5>
                      <button
                        type="button"
                        className="btn btn-sm btn-light btn-icon"
                        onClick={() => setSelectedId(null)}
                        title="Close"
                      >
                        <i className="ri-close-line" />
                      </button>
                    </div>

                    <div className="attachments-preview-box">
                      <span
                        className="attachments-preview-icon"
                        style={{ background: selectedMeta.bg, color: selectedMeta.color }}
                      >
                        <i className={selectedMeta.icon} />
                      </span>
                      <div className="fw-semibold mt-2 text-center text-truncate w-100 px-2">
                        {selected.originalFileName || selected.fileName}
                      </div>
                      <div className="text-muted small">{formatBytes(selected.fileSize)}</div>
                      <div className="attachments-preview-actions">
                        <Button
                          color="light"
                          size="sm"
                          outline
                          className="attachments-preview-btn"
                          onClick={() =>
                            window.open(
                              getAttachmentDownloadUrl(selected.attachmentId),
                              "_blank"
                            )
                          }
                        >
                          <i className="ri-eye-line me-1" />
                          Preview
                        </Button>
                        <Button
                          color="primary"
                          size="sm"
                          outline
                          className="attachments-preview-btn"
                          tag="a"
                          href={getAttachmentDownloadUrl(selected.attachmentId)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <i className="ri-download-2-line me-1" />
                          Download
                        </Button>
                      </div>
                    </div>

                    <h6 className="attachments-section-title">File Details</h6>
                    <div className="attachments-detail-list">
                      <div className="attachments-detail-row">
                        <span className="label">Related Item / Task</span>
                        <span className="value">
                          {selected.itemTitle ? (
                            <span className="attachments-detail-pill">{selected.itemTitle}</span>
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Calendar</span>
                        <span className="value">{selected.calendarName || "—"}</span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Uploaded By</span>
                        <span className="value d-flex align-items-center gap-2 justify-content-end">
                          <span className="attachments-avatar sm">
                            {initials(selected.uploadedByName)}
                          </span>
                          {selected.uploadedByName || "—"}
                        </span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Uploaded On</span>
                        <span className="value">{formatDateTime(selected.createdOn)}</span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">File Type</span>
                        <span className="value">{selectedMeta.label}</span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Size</span>
                        <span className="value">{formatBytes(selected.fileSize)}</span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Location</span>
                        <span className="value text-end">
                          {selected.calendarName || selected.itemTitle
                            ? `/${selected.calendarName || "Calendar"}/${selected.itemTitle || "Item"}/`
                            : "—"}
                        </span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Description</span>
                        <span className="value text-end">
                          {selected.remarks || "—"}
                        </span>
                      </div>
                      <div className="attachments-detail-row">
                        <span className="label">Tags</span>
                        <span className="value d-flex align-items-center gap-1 justify-content-end flex-wrap">
                          {selected.attachmentTypeName ? (
                            <span className="attachments-tag">{selected.attachmentTypeName}</span>
                          ) : null}
                          <button type="button" className="attachments-tag-add" title="Add tag">
                            <i className="ri-add-line" />
                          </button>
                        </span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                      <h6 className="attachments-section-title mb-0">Activity</h6>
                      <button type="button" className="btn btn-link btn-sm p-0">
                        View all
                      </button>
                    </div>

                    <div className="attachments-activity-list">
                      <div className="attachments-activity-item">
                        <span className="attachments-avatar sm">
                          {initials(selected.uploadedByName)}
                        </span>
                        <div>
                          <div className="act-text">
                            <strong>{selected.uploadedByName || "Someone"}</strong> uploaded
                            this file
                          </div>
                          <div className="act-time">{formatDateTime(selected.createdOn)}</div>
                        </div>
                      </div>
                      {activity.map((a) => (
                        <div className="attachments-activity-item" key={a.activityId}>
                          <span className="attachments-avatar sm">
                            {initials(a.createdByName)}
                          </span>
                          <div>
                            <div className="act-text">
                              <strong>{a.createdByName || "User"}</strong>{" "}
                              {a.activityMessage || a.activityName || "updated"}
                            </div>
                            <div className="act-time">{formatDateTime(a.createdOn)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="attachments-comment-wrap">
                      <Input
                        placeholder="Write a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <button type="button" className="attachments-comment-send" title="Send">
                        <i className="ri-send-plane-fill" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ) : null}
          </Row>
        </Container>
      </div>

      <Modal isOpen={uploadOpen} toggle={() => setUploadOpen(false)} centered>
        <ModalHeader toggle={() => setUploadOpen(false)}>Upload Files</ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <label className="form-label">Related Item / Task</label>
            <Input
              type="select"
              value={uploadItemId}
              onChange={(e) => setUploadItemId(e.target.value)}
            >
              <option value="">Select item…</option>
              {items.map((it) => (
                <option key={it.calendarItemId} value={it.calendarItemId}>
                  {it.title}
                </option>
              ))}
            </Input>
          </div>
          <div>
            <label className="form-label">File</label>
            <Input
              type="file"
              innerRef={fileInputRef}
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={() => setUploadOpen(false)}>
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={!uploadFile || !uploadItemId || uploading}
            onClick={doUpload}
          >
            {uploading ? <Spinner size="sm" /> : "Upload"}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default CalendarAttachments;
