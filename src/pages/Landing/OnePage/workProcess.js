import React from 'react';
import { Col, Container, Row } from 'reactstrap';

import processArrow from "../../../assets/images/landing/process-arrow-img.png";

const steps = [
    {
        step: "01",
        title: "Create",
        description: "Add tasks, meetings, reminders, appointments, payments and deadlines.",
        icon: "ri-add-circle-line",
    },
    {
        step: "02",
        title: "Organize",
        description: "Assign work, set priorities, add reminders and organize everything into calendars.",
        icon: "ri-calendar-check-line",
    },
    {
        step: "03",
        title: "Stay on Track",
        description: "Track progress, receive notifications and never miss an important deadline.",
        icon: "ri-notification-badge-line",
    },
];

const WorkProcess = () => {
    return (
        <React.Fragment>
            <section className="section bg-light" id="how-it-works">
                <Container>
                    <Row className="justify-content-center">
                        <Col lg={8}>
                            <div className="text-center mb-5">
                                <h3 className="mb-3 fw-semibold">How It Works</h3>
                                <p className="text-muted mb-0 ff-secondary">
                                    Everything organized in 3 simple steps — Create → Organize → Track
                                </p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="text-center">
                        {steps.map((item, index) => (
                            <Col lg={4} key={item.title}>
                                <div className="process-card mt-4">
                                    {index < steps.length - 1 && (
                                        <div className="process-arrow-img d-none d-lg-block">
                                            <img src={processArrow} alt="" className="img-fluid" />
                                        </div>
                                    )}
                                    <div className="avatar-sm icon-effect mx-auto mb-4">
                                        <div className="avatar-title bg-transparent text-primary rounded-circle h1">
                                            <i className={item.icon}></i>
                                        </div>
                                    </div>
                                    <p className="text-primary fw-semibold mb-2">{item.step}</p>
                                    <h5>{item.title}</h5>
                                    <p className="text-muted ff-secondary mb-0">{item.description}</p>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default WorkProcess;
