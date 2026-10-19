import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import SimpleBar from "simplebar-react";

//Import Components
import VerticalLayout from "./VerticalLayouts";
import TwoColumnLayout from "./TwoColumnLayout";
import { Container } from "reactstrap";
import HorizontalLayout from "./HorizontalLayout";
import CalendarLeftPanel from "../pages/CalendarApp/CalendarView/CalendarLeftPanel";
import ItemsLeftPanel from "../pages/CalendarApp/Items/ItemsLeftPanel";
import AssignmentsLeftPanel from "../pages/CalendarApp/Assignments/AssignmentsLeftPanel";
import RemindersLeftPanel from "../pages/CalendarApp/Reminders/RemindersLeftPanel";
import AttachmentsLeftPanel from "../pages/CalendarApp/Attachments/AttachmentsLeftPanel";
import ActivityLeftPanel from "../pages/CalendarApp/Activity/ActivityLeftPanel";
import SettingsLeftPanel from "../pages/CalendarApp/Settings/SettingsLeftPanel";

const Sidebar = ({ layoutType }) => {

  useEffect(() => {
    var verticalOverlay = document.getElementsByClassName("vertical-overlay");
    if (verticalOverlay) {
      verticalOverlay[0].addEventListener("click", function () {
        document.body.classList.remove("vertical-sidebar-enable");
      });
    }
  });

  const addEventListenerOnSmHoverMenu = () => {
    // add listener Sidebar Hover icon on change layout from setting
    if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover-active');
    } else if (document.documentElement.getAttribute('data-sidebar-size') === 'sm-hover-active') {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    } else {
      document.documentElement.setAttribute('data-sidebar-size', 'sm-hover');
    }
  };

  const logoSrc = "/logo.png";
  const logoAlt = "TaskSoft logo";

  const renderBrandLogo = (logoClass) => (
    <Link to="/" className={`logo ${logoClass}`}>
      <span className="logo-sm">
        <img src={logoSrc} alt={logoAlt} className="brand-logo-icon" height="50" />
      </span>
      <span className="logo-lg">
        <span className="brand-logo-expanded">
          <img src={logoSrc} alt={logoAlt} className="brand-logo-icon" height="50" />
          <span className="brand-logo-text">
            <span className="brand-logo-title">Calendar</span>
            <span className="brand-logo-subtitle">SoftOnCloud</span>
          </span>
        </span>
      </span>
    </Link>
  );

  return (
    <React.Fragment>
      <div className="app-menu navbar-menu">
        <div className="navbar-brand-box">
          {renderBrandLogo("logo-dark")}
          {renderBrandLogo("logo-light")}
          <button
            onClick={addEventListenerOnSmHoverMenu}
            type="button"
            className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover"
            id="vertical-hover"
          >
            <i className="ri-record-circle-line"></i>
          </button>
        </div>
        {layoutType === "horizontal" ? (
          <div id="scrollbar">
            <Container fluid>
              <div id="two-column-menu"></div>
              <ul className="navbar-nav" id="navbar-nav">
                <HorizontalLayout />
              </ul>
            </Container>
          </div>
        ) : layoutType === 'twocolumn' ? (
          <React.Fragment>
            <TwoColumnLayout layoutType={layoutType} />
            <div className="sidebar-background"></div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <SimpleBar id="scrollbar" className="h-100">
              <Container fluid>
                <div id="two-column-menu"></div>
                <ul className="navbar-nav" id="navbar-nav">
                  <VerticalLayout layoutType={layoutType} />
                </ul>
                <CalendarLeftPanel />
                <ItemsLeftPanel />
                <AssignmentsLeftPanel />
                <RemindersLeftPanel />
                <AttachmentsLeftPanel />
                <ActivityLeftPanel />
                <SettingsLeftPanel />
              </Container>
            </SimpleBar>
            <div className="sidebar-background"></div>
          </React.Fragment>
        )}
      </div>
      <div className="vertical-overlay"></div>
    </React.Fragment>
  );
};

export default Sidebar;
