import React from 'react';
import { Col, Container, Row } from 'reactstrap';

const teamTypes = [
    { icon: "ri-rocket-line", label: "Startups" },
    { icon: "ri-team-line", label: "SMEs" },
    { icon: "ri-building-line", label: "Enterprises" },
    { icon: "ri-user-location-line", label: "Remote Teams" },
    { icon: "ri-global-line", label: "Global Teams" },
    { icon: "ri-user-star-line", label: "Freelancers" },
];

const Features = () => {
    return (
        <React.Fragment>

            <section className="section bg-light py-5" id="features">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={6} sm={7} className="mx-auto">
                            <div>
                                <img src="/tab.png" alt="SoftOnCloud Calendar" className="img-fluid mx-auto" />
                            </div>
                        </Col>
                        <Col lg={6}>
                            <div className="text-muted">
                                <h3 className="mb-4 fs-20 text-body">See Your Time. Plan Your Success.</h3>
                                <div className="vstack gap-3">
                                    {[
                                        "Visual timelines & task dependencies",
                                        "Drag & drop scheduling",
                                        "Color-coded events & categories",
                                        "Track milestones & deadlines",
                                        "Stay ahead with real-time updates",
                                    ].map((item) => (
                                        <div key={item} className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <div className="avatar-xs">
                                                    <div className="avatar-title bg-primary text-white rounded-circle">
                                                        <i className="ri-check-line"></i>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className="mb-0 text-body ff-secondary">{item}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className="section">
                <Container>
                    <Row className="align-items-center gy-4">
                        <Col lg={6} className="order-2 order-lg-1">
                            <div className="text-muted">
                                <h3 className="mb-4 fs-20 text-body">Built for Every Team</h3>

                                <Row className="g-3 mb-4">
                                    {teamTypes.map((team) => (
                                        <Col xs={6} sm={4} lg={6} xl={4} key={team.label}>
                                            <div className="text-center p-3 bg-light rounded">
                                                <div className="avatar-sm mx-auto mb-2">
                                                    <div className="avatar-title bg-white text-primary rounded">
                                                        <i className={`${team.icon} fs-20`}></i>
                                                    </div>
                                                </div>
                                                <p className="mb-0 fw-medium text-body fs-14">{team.label}</p>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                <p className="mb-0 ff-secondary text-body">
                                    From individuals to large organizations, SoftOnCloud Calendar keeps everyone aligned.
                                </p>
                            </div>
                        </Col>

                        <Col lg={6} sm={7} className="col-10 ms-auto order-1 order-lg-2">
                            <div>
                                <img src="/allnew.png" alt="Built for Every Team" className="img-fluid" />
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </React.Fragment>
    );
};

export default Features;
