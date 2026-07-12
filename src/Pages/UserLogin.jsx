import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./UserLogin.css";

export default function UserLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleLogin(event) {
        event.preventDefault();
        setErrorMessage("");

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMessage(error.message || "Unable to sign in. Please try again.");
            return;
        }

        const user = data?.user;

        if (!user) {
            await supabase.auth.signOut();
            setErrorMessage("Access Denied: You do not have the required permissions for this portal.");
            return;
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (profileError || !profile?.role || profile.role !== "user") {
            await supabase.auth.signOut();
            setErrorMessage("Access Denied: You do not have the required permissions for this portal.");
            return;
        }

        if (data?.session) {
            alert("Login successful!");
            navigate("/userlayout");
        }
    }

    return (
        <div className="user-login-page">
            <div className="user-login-card">
                <h3>User Login</h3>
                <p className="user-login-subtitle">Access your patient dashboard</p>

                <form className="user-login-form" onSubmit={handleLogin}>
                    <label className="user-login-field">
                        <span>Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </label>

                    <label className="user-login-field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </label>

                    {errorMessage ? (
                        <p className="user-login-error" role="alert">
                            {errorMessage}
                        </p>
                    ) : null}

                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
}