    import { Link } from 'react-router-dom';
    import { PATHS } from "../Routes/pathes";
    import './LandingPage.css';

    const PORTALS = [
    {
        title: 'User Portal',
        description: 'Search medicines, compare pharmacies, reserve & track pickups',
        icon: '👤',
        to: PATHS.USER_LOGIN,
    },
    {
        title: 'Pharmacy Dashboard',
        description: 'Manage inventory, fulfill reservations, view analytics',
        icon: '🏬',
        to: PATHS.PHARMACY_LOGIN,
    },
    {
        title: 'Admin Panel',
        description: 'Oversee users, pharmacies, medicines and all reservations',
        icon: '🛡️',
        to: PATHS.ADMIN_LOGIN,
    },
    ];

    const STATS = [
    { label: 'Pharmacies', value: '3' },
    { label: 'Medicines', value: '18+' },
    { label: 'Users', value: '1,847' },
    { label: 'Daily Reservations', value: '247' },
    ];

    export default function LandingPage() {
    return (
        <div className="landing-page">

        {/* Header */}
        <header className="container-fluid px-3 px-md-4 py-3">
            <div className="d-flex align-items-center gap-2">
            <span className="landing-page__logo">💊</span>
            <span className="landing-page__brand-name">PharmaCare</span>
            </div>
        </header>

        {/* Hero */}
        <main className="container text-center py-4 py-md-5 px-3">

            <span className="landing-page__pill d-inline-flex align-items-center mb-3 mb-md-4">
            Multi-Pharmacy Inventory &amp; Reservation Platform
            </span>

            <h1 className="landing-page__heading mx-auto mb-3 mb-md-4">
            Find, Compare &amp; <span className="landing-page__heading-accent">Reserve Medicines</span>
            </h1>

            <p className="landing-page__subtext mx-auto mb-4 mb-md-5">
            A unified platform connecting patients with pharmacies — search availability, compare
            prices, reserve instantly.
            </p>

            {/* Portal cards */}
            <div className="row g-3 g-md-4 justify-content-center mb-5">
            {PORTALS.map((portal) => (
                <div key={portal.title} className="col-12 col-md-6 col-lg-4">
                <Link to={portal.to} className="landing-page__portal-card d-flex flex-column gap-2 h-100 text-decoration-none">
                    <span className="landing-page__portal-icon">{portal.icon}</span>
                    <span className="landing-page__portal-title">
                    {portal.title} <span className="landing-page__portal-arrow">›</span>
                    </span>
                    <span className="landing-page__portal-description">{portal.description}</span>
                </Link>
                </div>
            ))}
            </div>

            {/* Stats */}
            <div className="row row-cols-2 row-cols-md-4 g-4 justify-content-center">
            {STATS.map((stat) => (
                <div key={stat.label} className="col d-flex flex-column align-items-center">
                <span className="landing-page__stat-value">{stat.value}</span>
                <span className="landing-page__stat-label">{stat.label}</span>
                </div>
            ))}
            </div>

        </main>

        <footer className="landing-page__footer text-center py-4 px-3">
            © 2026 PharmaCare Platform · All rights reserved
        </footer>
        </div>
    );
    }