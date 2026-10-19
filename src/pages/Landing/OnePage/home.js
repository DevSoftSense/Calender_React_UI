import React from 'react';
import { Col, Container, Row } from 'reactstrap';
import { Link } from 'react-router-dom';

// Import Images
import imgpattern from "../../../assets/images/landing/img-pattern.png";

const heroFeatures = [
    "Smart Calendar & Availability",
    "Tasks, Reminders & Deadlines",
    "Team Scheduling & Assignments",
    "Attachments, Notes & Activity",
    "Personal & Work Calendars",
    "Reports & Productivity Insights",
];

const heroHighlights = [
    { icon: "ri-shield-check-line", label: "Secure & Private" },
    { icon: "ri-refresh-line", label: "Always in Sync" },
    { icon: "ri-cursor-line", label: "Easy to Use" },
    { icon: "ri-global-line", label: "Access Anywhere" },
];

const Home = () => {
    return (
        <React.Fragment>
            <section className="section pb-0 hero-section" id="hero">
                <div className="bg-overlay bg-overlay-pattern"></div>
                <Container fluid className="hero-container px-3 px-lg-4 px-xl-5">
                    <Row className="align-items-center hero-content-row g-4 g-lg-4">
                        <Col lg={4} className="order-2 order-lg-1">
                            <div className="hero-copy text-center text-lg-start">
                                {/* <div className="d-inline-flex align-items-center gap-2 mb-3">
                                    <img src="/logo.png" alt="Calendar" className="brand-logo-icon rounded-3" height="40" />
                                    <div className="text-start">
                                        <div className="fw-semibold fs-18 text-body mb-0">Calendar</div>
                                        <div className="text-muted fs-12">Smart Scheduling &amp; Productivity</div>
                                    </div>
                                </div> */}

                                <h1 className="display-6 fw-semibold mb-3 lh-base">
                                    Plan Smarter.<br />
                                    <span className="text-primary">Schedule Better.</span><br />
                                    Deliver On Time.
                                </h1>
                                <p className="lead text-muted lh-base mb-4">
                                    SoftOnCloud Calendar helps you organize your work, manage time, and collaborate with your team — all in one beautifully simple platform.
                                </p>

                                <ul className="list-unstyled hero-feature-list text-start d-inline-block mb-4">
                                    {heroFeatures.map((feature) => (
                                        <li key={feature} className="d-flex align-items-center gap-2 mb-2">
                                            <span className="avatar-xs flex-shrink-0">
                                                <span className="avatar-title rounded-circle bg-primary-subtle text-primary">
                                                    <i className="ri-check-line"></i>
                                                </span>
                                            </span>
                                            <span className="fw-medium text-body">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-lg-start mb-4">
                                    <Link to="/register" className="btn btn-primary">Start Free Trial</Link>
                                    <a href="https://softoncloud.com/" target="_blank" rel="noopener noreferrer" className="btn btn-soft-primary">
                                        Explore All Apps <i className="ri-arrow-right-line align-middle ms-1"></i>
                                    </a>
                                </div>

                                <div className="d-flex flex-wrap gap-3 gap-lg-4 justify-content-center justify-content-lg-start hero-trust-row">
                                    {heroHighlights.map((item) => (
                                        <div key={item.label} className="text-center text-lg-start">
                                            <div className="avatar-xs mx-auto mx-lg-0 mb-1">
                                                <span className="avatar-title rounded-circle bg-light text-primary">
                                                    <i className={item.icon}></i>
                                                </span>
                                            </div>
                                            <div className="fs-12 text-muted fw-medium">{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                        <Col lg={8} className="order-1 order-lg-2">
                            <div className="demo-carousel">
                                <div className="demo-img-patten-top d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="" />
                                </div>
                                <div className="demo-img-patten-bottom d-none d-sm-block">
                                    <img src={imgpattern} className="d-block img-fluid" alt="" />
                                </div>
                                <div className="carousel-inner">
                                    <img src="/com.png" className="d-block w-100" alt="SoftOnCloud Calendar" />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>

                <div className="position-absolute start-0 end-0 bottom-0 hero-shape-svg">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1"
                        // xmlns:xlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 1440 120">
                        <g mask="url(&quot;#SvgjsMask1003&quot;)" fill="none">
                            <path d="M 0,118 C 288,98.6 1152,40.4 1440,21L1440 140L0 140z">
                            </path>
                        </g>
                    </svg>
                </div>

            </section>
        </React.Fragment>
    );
};

export default Home;
