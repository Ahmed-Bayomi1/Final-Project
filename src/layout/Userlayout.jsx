import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../supabase';
import './Userlayout.css';

export default function Userlayout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

 useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Get current session
                const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                
                if (sessionError || !sessionData?.session?.user?.id) {
                    setError('No active session found');
                    setUser({ full_name: 'User' });
                    setLoading(false);
                    return;
                }

                const userId = sessionData.session.user.id;

                // Fetch user profile from profiles table
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                // Always set a user object - use profile data if available, otherwise use default
                if (profileData) {
                    setUser(profileData);
                } else {
                    setUser({ full_name: 'User' });
                }

                // Log error for debugging but don't show error banner
                if (profileError) {
                    console.error('Profile fetch error (handled gracefully):', profileError);
                }
            } catch (err) {
                console.error('Critical error:', err);
                setUser({ full_name: 'User' });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    return (
        <div className="user-layout">
            <Navbar />
            <div className="user-layout__content">
                {loading && (
                    <div className="user-greeting-container">
                        <p className="user-greeting">Loading user data...</p>
                    </div>
                )}
                {error && (
                    <div className="user-greeting-container">
                        <p className="user-greeting user-greeting--error">{error}</p>
                    </div>
                )}
                {!loading && user && (
                    <div className="user-greeting-container">
                        <p className="user-greeting">Welcome, {user.full_name || 'User'}! 👋</p>
                    </div>
                )}
                <Outlet context={{ user, loading, error }} />
            </div>
        </div>
    );
}