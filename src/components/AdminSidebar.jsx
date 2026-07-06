    import { useState, useEffect } from "react";
    import { NavLink, useNavigate } from "react-router-dom";
    import { PATHS } from "../Routes/pathes";
    import "./AdminSidebar.css";

    const NAV_ITEMS = [
    {
        label: "Overview",
        to: PATHS.ADMIN_OVERVIEW,
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 15V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M10 15V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M16 15v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        ),
    },
    {
        label: "User Management",
        to: PATHS.ADMIN_USERS,
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="6.5" r="2.25" stroke="currentColor" strokeWidth="1.6" />
            <path
            d="M2.75 16c0-2.4 2-4 4.25-4s4.25 1.6 4.25 4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            />
            <circle cx="13.5" cy="6.5" r="1.85" stroke="currentColor" strokeWidth="1.6" />
            <path
            d="M12.4 8.7c1.85.2 3.35 1.65 3.35 3.55"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            />
        </svg>
        ),
    },
    {
        label: "Pharmacy Management",
        to: PATHS.ADMIN_PHARMACIES,
        icon: (
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7 6.5h6M7 9.5h6M7 12.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        ),
    },
    ];

    const LogoIcon = () => (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
        d="M8 12L12 8M9 5.5L10.2 4.3a2.6 2.6 0 013.7 3.7L12.6 9.2M11 14.5L9.8 15.7a2.6 2.6 0 01-3.7-3.7L7.4 10.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        />
    </svg>
    );

    const SignOutIcon = () => (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3.5H4.5v13H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 10h6.5M15 7l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    );

    const MenuIcon = () => (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    );

    const CloseIcon = () => (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    );

    export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    // Close the mobile drawer whenever the viewport grows back to desktop size
    useEffect(() => {
        const handleResize = () => {
        if (window.innerWidth > 768) setIsOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLinkClick = () => setIsOpen(false);

    const handleSignOut = () => {
        setIsOpen(false);
        navigate(PATHS.ADMIN_LOGIN);
    };

    return (
        <>
        <button
            type="button"
            className="admin-sidebar__toggle"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
        >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        {isOpen && <div className="admin-sidebar__overlay" onClick={() => setIsOpen(false)} />}

        <aside className={`admin-sidebar ${isOpen ? "admin-sidebar--open" : ""}`}>
            <div className="admin-sidebar__header">
            <span className="admin-sidebar__logo">
                <LogoIcon />
            </span>
            <span className="admin-sidebar__title">PharmaCare Admin</span>
            </div>

            <nav className="admin-sidebar__nav">
            {NAV_ITEMS.map((item) => (
                <NavLink
                key={item.to}
                to={item.to}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                    `admin-sidebar__link${isActive ? " admin-sidebar__link--active" : ""}`
                }
                >
                <span className="admin-sidebar__icon">{item.icon}</span>
                <span className="admin-sidebar__label">{item.label}</span>
                </NavLink>
            ))}
            </nav>

            <div className="admin-sidebar__footer">
            <button type="button" className="admin-sidebar__signout" onClick={handleSignOut}>
                <span className="admin-sidebar__icon">
                <SignOutIcon />
                </span>
                <span className="admin-sidebar__label">Sign Out</span>
            </button>
            </div>
        </aside>
        </>
    );
    }