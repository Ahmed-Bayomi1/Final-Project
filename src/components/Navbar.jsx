import { NavLink } from 'react-router-dom';
import { PATHS } from '../Routes/pathes';
import './Navbar.css';

const NAV_ITEMS = [
    { label: 'Home', icon: '🏠', to: PATHS.HOME_USER },
    { label: 'Search', icon: '🔍', to: PATHS.SEARCH_USER },
    { label: 'Reservation', icon: '📅', to: PATHS.RESERVE_USER },
    { label: 'Profile', icon: '👤', to: PATHS.PROFILE_USER },
];

export default function Navbar() {
    return (
        <nav className="app-navbar">
            <div className="app-navbar__brand">
                <span className="app-navbar__logo">💊</span>
                <span className="app-navbar__brand-name">PharmaCare</span>
            </div>

            <ul className="app-navbar__links">
                {NAV_ITEMS.map((item) => (
                    <li key={item.label} className="app-navbar__item">
                        <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                                `app-navbar__link ${isActive ? 'app-navbar__link--active' : ''}`
                            }
                        >
                            <span className="app-navbar__icon">{item.icon}</span>
                            <span className="app-navbar__label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}