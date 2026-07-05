 import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PATHS } from "../Routes/pathes";
import "./PharmacyNavbar.css";

const NAV_LINKS = [
  { label: "Dashboard", to: PATHS.PHARMACY_DASHBOARD },
  { label: "Inventory", to: PATHS.PHARMACY_INVENTORY },
  { label: "Analytics", to: PATHS.PHARMACY_ANALYTICS },
  { label: "Reservations", to: PATHS.PHARMACY_RESERVATIONS },
];

    function PharmacyNavbar() {
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="navbar-pharmacy">
        <div className="navbar-pharmacy__container">
            <NavLink
            to="/pharmacy/dashboard"
            className="navbar-pharmacy__brand"
            onClick={closeMenu}
            >
            PharmaCare
            </NavLink>

            <button
            type="button"
            className={`navbar-pharmacy__toggle ${
                isOpen ? "navbar-pharmacy__toggle--active" : ""
            }`}
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
            >
            <span className="navbar-pharmacy__bar" />
            <span className="navbar-pharmacy__bar" />
            <span className="navbar-pharmacy__bar" />
            </button>

            <ul
            className={`navbar-pharmacy__links ${
                isOpen ? "navbar-pharmacy__links--open" : ""
            }`}
            >
            {NAV_LINKS.map((link) => (
                <li key={link.to} className="navbar-pharmacy__item">
                <NavLink
                    to={link.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                    `navbar-pharmacy__link ${
                        isActive ? "navbar-pharmacy__link--active" : ""
                    }`
                    }
                >
                    {link.label}
                </NavLink>
                </li>
            ))}

            {/* Mobile-only logout, mirrors desktop action button below */}
            <li className="navbar-pharmacy__item navbar-pharmacy__item--mobile-only">
                <button
                type="button"
                className="navbar-pharmacy__logout"
                onClick={closeMenu}
                >
                Logout
                </button>
            </li>
            </ul>

            <button type="button" className="navbar-pharmacy__logout navbar-pharmacy__logout--desktop">
            Logout
            </button>
        </div>
        </nav>
    );
    }

    export default PharmacyNavbar;