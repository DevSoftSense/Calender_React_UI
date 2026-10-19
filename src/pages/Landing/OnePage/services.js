import React from 'react';
import { Col, Container, Row } from 'reactstrap';

const serviceItems = [
    {
        icon: "ri-calendar-2-line",
        title: "Smart Calendar",
        description: "View events, tasks and deadlines in day, week, month or agenda view.",
    },
    {
        icon: "ri-task-line",
        title: "Tasks & Assignments",
        description: "Create tasks, assign to team members and track progress in real-time.",
    },
    {
        icon: "ri-notification-3-line",
        title: "Reminders & Alerts",
        description: "Never miss important deadlines with smart reminders and alerts.",
    },
    {
        icon: "ri-attachment-2",
        title: "Attachments & Notes",
        description: "Attach files, add notes and keep everything related in one place.",
    },
    {
        icon: "ri-group-line",
        title: "Team Collaboration",
        description: "Share calendars, assign work and collaborate seamlessly.",
    },
    {
        icon: "ri-calendar-check-line",
        title: "Personal & Work",
        description: "Separate personal and work calendars for better work-life balance.",
    },
    {
        icon: "ri-timer-line",
        title: "Activity Tracking",
        description: "Track all actions, updates and changes across your calendar.",
    },
    {
        icon: "ri-sparkling-line",
        title: "Reports & Insights",
        description: "Get productivity insights and reports to improve time management.",
    },
];

const Services = () => {
    return (
        <React.Fragment>
            <section className="section" id="services">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h5 className="fs-12 text-uppercase text-primary mb-2">Powerful Features</h5>
                                <h3 className="mb-3 fw-semibold">Everything You Need to Stay Organized</h3>
                                <p className="text-muted mb-0 ff-secondary">
                                    All the tools you need to plan, track and manage your work effortlessly.
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-3">
                        {serviceItems.map((item) => (
                            <Col lg={3} md={6} key={item.title}>
                                <div className="d-flex p-3">
                                    <div className="flex-shrink-0 me-3">
                                        <div className="avatar-sm icon-effect">
                                            <div className="avatar-title bg-transparent text-primary rounded-circle">
                                                <i className={`${item.icon} fs-36`}></i>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-grow-1">
                                        <h5 className="fs-18">{item.title}</h5>
                                        <p className="text-muted mb-0 ff-secondary">{item.description}</p>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Services;
