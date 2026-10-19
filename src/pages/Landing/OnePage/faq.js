import React, { useState } from 'react';
import { Col, Container, Row, Collapse } from 'reactstrap';
import classnames from "classnames";

const faqSections = [
    {
        icon: "ri-question-line",
        title: "General Questions",
        id: "general",
        items: [
            {
                question: "What is SoftOnCloud Calendar?",
                answer: "SoftOnCloud Calendar is a productivity platform that helps you organize tasks, meetings, reminders, appointments, payments, and important deadlines in one place.",
            },
            {
                question: "Can I manage tasks and events together?",
                answer: "Yes. You can manage tasks, meetings, payments, appointments, reminders, and other activities from a single calendar without switching between tools.",
            },
            {
                question: "Can I view my schedule in different formats?",
                answer: "Yes. Switch between Day, Week, Month, and Agenda views to plan and review your schedule the way you prefer.",
            },
            {
                question: "Can I create recurring tasks and reminders?",
                answer: "Yes. Create recurring items for activities that repeat daily, weekly, monthly, or on a custom schedule.",
            },
            {
                question: "Can I categorize my calendar items?",
                answer: "Yes. Organize items using calendars, categories, tags, and item types such as Task, Meeting, Payment, Reminder, and Personal.",
            },
        ],
    },
    {
        icon: "ri-task-line",
        title: "Tasks & Productivity",
        id: "tasks",
        items: [
            {
                question: "Can I assign tasks to my team members?",
                answer: "Yes. Assign items to team members, track their progress, set priorities, and monitor pending, completed, and overdue work.",
            },
            {
                question: "Can I set priorities and due dates?",
                answer: "Yes. Each item can include a due date, time, priority, assignee, status, and other details to keep work organized.",
            },
            {
                question: "How do I track overdue tasks?",
                answer: "The dashboard highlights overdue items automatically so you can quickly see what needs attention.",
            },
            {
                question: "Can I attach files and notes to items?",
                answer: "Yes. Add attachments and notes to keep all related information together with each calendar item.",
            },
            {
                question: "Can I track changes across my calendar?",
                answer: "Yes. The activity log records updates, assignments, and other actions so you always know what changed and when.",
            },
        ],
    },
    {
        icon: "ri-notification-3-line",
        title: "Reminders & Notifications",
        id: "reminders",
        items: [
            {
                question: "Can I set reminders before an event starts?",
                answer: "Yes. Configure reminders such as 15 minutes, 30 minutes, 1 hour, or other intervals before an item is due.",
            },
            {
                question: "Which notification channels are supported?",
                answer: "Depending on your settings, reminders can be delivered through In-App notifications, Email, SMS, and WhatsApp.",
            },
            {
                question: "What happens if I miss a reminder?",
                answer: "Missed reminders stay visible in your Reminders section so you can review and follow up on them.",
            },
            {
                question: "Can I filter reminders by status?",
                answer: "Yes. View reminders by Today, Tomorrow, This Week, Upcoming, Missed, and Completed to stay on top of your schedule.",
            },
        ],
    },
    {
        icon: "ri-shield-keyhole-line",
        title: "Security & Settings",
        id: "security",
        items: [
            {
                question: "Can I customize my calendar settings?",
                answer: "Yes. Customize your timezone, date format, time format, week start day, language, theme, colors, and other preferences.",
            },
            {
                question: "Does Calendar support dark mode?",
                answer: "Yes. Choose between Light, Dark, and System themes to match your preferred appearance.",
            },
            {
                question: "Is my calendar data secure?",
                answer: "SoftOnCloud Calendar is built with security and privacy in mind, including account settings, permissions, and session management.",
            },
            {
                question: "Can I manage separate personal and work calendars?",
                answer: "Yes. Keep personal and work schedules separate for better organization and work-life balance.",
            },
        ],
    },
];

const FaqAccordion = ({ sectionId, items }) => {
    const [openIndex, setOpenIndex] = useState(-1);

    const toggle = (index) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <div
            className="accordion custom-accordionwithicon custom-accordion-border accordion-border-box"
            id={`${sectionId}-accordion`}
        >
            {items.map((item, index) => (
                <div className="accordion-item" key={item.question}>
                    <h2 className="accordion-header" id={`${sectionId}-heading-${index}`}>
                        <button
                            className={classnames("accordion-button", "fw-medium", {
                                collapsed: openIndex !== index,
                            })}
                            type="button"
                            onClick={() => toggle(index)}
                            style={{ cursor: "pointer" }}
                        >
                            {item.question}
                        </button>
                    </h2>
                    <Collapse isOpen={openIndex === index} className="accordion-collapse">
                        <div className="accordion-body ff-secondary">{item.answer}</div>
                    </Collapse>
                </div>
            ))}
        </div>
    );
};

const Faqs = () => {
    return (
        <React.Fragment>
            <section className="section" id="faqs">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">Frequently Asked Questions</h3>
                                <p className="text-muted mb-4 ff-secondary">
                                    If you can not find answer to your question in our FAQ, you can
                                    always contact us or email us. We will answer you shortly!
                                </p>

                                <div className="hstack gap-2 justify-content-center">
                                    <a
                                        href="mailto:noreply@softoncloud.com"
                                        className="btn btn-primary rounded-pill"
                                    >
                                        <i className="ri-mail-line align-middle me-2"></i>
                                        Email Us
                                    </a>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-lg-5 g-4">
                        {faqSections.map((section) => (
                            <Col lg={6} key={section.id}>
                                <div className="d-flex align-items-center mb-2">
                                    <div className="flex-shrink-0 me-1">
                                        <i className={`${section.icon} fs-24 align-middle text-success me-1`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="mb-0 fw-semibold">{section.title}</h5>
                                    </div>
                                </div>
                                <FaqAccordion sectionId={section.id} items={section.items} />
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Faqs;
