import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Spinner,
  Alert,
} from "reactstrap";
import { createItem, getCalendars, getMasters } from "../../../helpers/calendar_api";

const emptyForm = {
  title: "",
  calendarId: "",
  itemTypeId: "",
  priorityId: "",
  statusId: "",
  dueDate: "",
  description: "",
};

const NewItemModal = ({ isOpen, toggle, onCreated }) => {
  const [form, setForm] = useState(emptyForm);
  const [calendars, setCalendars] = useState([]);
  const [masters, setMasters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [cals, m] = await Promise.all([getCalendars(), getMasters()]);
        if (cancelled) return;
        const calList = Array.isArray(cals) ? cals : [];
        setCalendars(calList);
        setMasters(m || {});
        const defaultCal =
          calList.find((c) => c.isDefault)?.calendarId ||
          calList[0]?.calendarId ||
          "";
        const defaultPriority = m?.priorities?.[0]?.id ?? "";
        const defaultStatus = m?.statuses?.[0]?.id ?? "";
        const defaultType = m?.itemTypes?.[0]?.id ?? "";
        setForm({
          ...emptyForm,
          calendarId: defaultCal ? String(defaultCal) : "",
          itemTypeId: defaultType !== "" ? String(defaultType) : "",
          priorityId: defaultPriority !== "" ? String(defaultPriority) : "",
          statusId: defaultStatus !== "" ? String(defaultStatus) : "",
        });
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load form data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.calendarId || !form.itemTypeId || !form.priorityId || !form.statusId) {
      setError("Calendar, type, priority and status are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const tz =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const payload = {
        calendarId: Number(form.calendarId),
        title: form.title.trim(),
        description: form.description || null,
        itemTypeId: Number(form.itemTypeId),
        categoryId: null,
        priorityId: Number(form.priorityId),
        statusId: Number(form.statusId),
        color: null,
        icon: null,
        location: null,
        latitude: null,
        longitude: null,
        timezoneName: tz,
        startDate: form.dueDate || null,
        startTime: null,
        endDate: null,
        endTime: null,
        dueDate: form.dueDate || null,
        dueTime: null,
        isAllDay: true,
        approvalRequired: false,
        approvalStatusId: null,
        estimatedHours: null,
      };
      const created = await createItem(payload);
      setForm(emptyForm);
      if (onCreated) onCreated(created);
      toggle();
    } catch (err) {
      setError(err.message || "Failed to create item");
    } finally {
      setSaving(false);
    }
  };

  const itemTypes = masters?.itemTypes || [];
  const priorities = masters?.priorities || [];
  const statuses = masters?.statuses || [];

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
      <ModalHeader toggle={toggle}>New Item</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {error ? <Alert color="danger">{error}</Alert> : null}
          {loading ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
            </div>
          ) : (
            <Row>
              <Col md={12}>
                <FormGroup>
                  <Label for="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={onChange}
                    placeholder="Item title"
                    required
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="calendarId">Calendar</Label>
                  <Input
                    type="select"
                    id="calendarId"
                    name="calendarId"
                    value={form.calendarId}
                    onChange={onChange}
                  >
                    <option value="">Select calendar</option>
                    {calendars.map((c) => (
                      <option key={c.calendarId} value={c.calendarId}>
                        {c.calendarName}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="itemTypeId">Item Type</Label>
                  <Input
                    type="select"
                    id="itemTypeId"
                    name="itemTypeId"
                    value={form.itemTypeId}
                    onChange={onChange}
                  >
                    <option value="">Select type</option>
                    {itemTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="priorityId">Priority</Label>
                  <Input
                    type="select"
                    id="priorityId"
                    name="priorityId"
                    value={form.priorityId}
                    onChange={onChange}
                  >
                    <option value="">Select priority</option>
                    {priorities.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="statusId">Status</Label>
                  <Input
                    type="select"
                    id="statusId"
                    name="statusId"
                    value={form.statusId}
                    onChange={onChange}
                  >
                    <option value="">Select status</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="dueDate">Due Date</Label>
                  <Input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={form.dueDate}
                    onChange={onChange}
                  />
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup>
                  <Label for="description">Description</Label>
                  <Input
                    type="textarea"
                    id="description"
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={onChange}
                    placeholder="Optional description"
                  />
                </FormGroup>
              </Col>
            </Row>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" type="button" onClick={toggle} disabled={saving}>
            Cancel
          </Button>
          <Button color="primary" type="submit" disabled={saving || loading}>
            {saving ? <Spinner size="sm" className="me-1" /> : null}
            Create Item
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default NewItemModal;
