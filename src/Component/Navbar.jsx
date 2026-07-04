    import React, { useEffect, useState } from "react";
    import { Link, useLocation, useNavigate } from "react-router-dom";
    // Make sure these are installed / imported once in your app (e.g. in main.jsx or App.js):
    // npm install bootstrap bootstrap-icons react-router-dom
    // import "bootstrap/dist/css/bootstrap.min.css";
    // import "bootstrap-icons/font/bootstrap-icons.css";

    import "./Navbar.css";
    import { PATHS } from "../Routes/pathes";

    const NAV_LINKS = [
    { label: "Home", icon: "bi-house-fill", path: PATHS.DASHBOARD },
    { label: "Search", icon: "bi-search", path: PATHS.SEARCH },
    { label: "Reservations", icon: "bi-calendar2-check", path: PATHS.RESERVE },
    { label: "Profile", icon: "bi-person", path: PATHS.PROFILE },
    ];

    export default function Navbar({
    brand = "PharmaCare",
    hasNotification = true,
    onSignOut,
    }) {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // adds a soft shadow once the page is scrolled, so the navbar
    // reads as "floating" rather than flat against the page content
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleNavClick = () => setIsOpen(false);

    const handleBack = () => {
        setIsOpen(false);
        navigate(-1);
    };

    return (
        <nav className={`navbar navbar-expand-lg pc-navbar ${scrolled ? "pc-navbar--scrolled" : ""}`}>
        <div className="container-fluid px-3 px-lg-4">

            {/* Left: back arrow + logo + brand */}
            <div className="d-flex align-items-center">
            <button
                type="button"
                className="pc-back-btn"
                aria-label="Go back"
                onClick={handleBack}
            >
                <i className="bi bi-arrow-left"></i>
            </button>
            <Link to={PATHS.DASHBOARD} className="d-flex align-items-center text-decoration-none pc-brand-link">
                <div className="pc-logo-icon">
                <i className="bi bi-capsule"></i>
                </div>
                <span className="pc-brand">{brand}</span>
            </Link>
            </div>

            {/* Mobile toggle: morphs into an X when open */}
            <button
            className={`pc-toggler ${isOpen ? "pc-toggler--open" : ""}`}
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
            >
            <span></span>
            <span></span>
            <span></span>
            </button>

            {/* Collapsible content */}
            <div className={`navbar-collapse pc-navbar-collapse-wrap ${isOpen ? "pc-navbar-collapse-wrap--open" : ""}`}>

            {/* Center nav links */}
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-1">
                {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                    <li className="nav-item" key={link.label}>
                    <Link
                        to={link.path}
                        className={`nav-link pc-nav-link ${isActive ? "active" : ""}`}
                        onClick={handleNavClick}
                    >
                        <i className={`bi ${link.icon}`}></i>
                        <span>{link.label}</span>
                    </Link>
                    </li>
                );
                })}
            </ul>

            {/* Right actions */}
            <div className="pc-right-actions d-flex align-items-center">
                <button type="button" className="pc-icon-btn" aria-label="Notifications">
                <i className="bi bi-bell"></i>
                {hasNotification && <span className="pc-dot"></span>}
                </button>

                <span className="pc-divider d-none d-lg-block"></span>

                <button
                type="button"
                className="pc-signout"
                onClick={() => {
                    setIsOpen(false);
                    if (onSignOut) onSignOut();
                }}
                >
                <i className="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
                </button>
            </div>

            </div>
        </div>
        </nav>
    );
    }