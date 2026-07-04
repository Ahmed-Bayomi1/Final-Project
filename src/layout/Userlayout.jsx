import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Userlayout.css';

export default function Userlayout() {
    return (
        <div className="user-layout">
            <Navbar />
            <div className="user-layout__content">
                <Outlet />
            </div>
        </div>
    );
}