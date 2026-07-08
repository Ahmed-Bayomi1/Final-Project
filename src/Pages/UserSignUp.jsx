import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./UserSignUp.css";

export default function UserSignUp() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [nationalId, setNationalId] = useState("");
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSignUp(event) {
        event.preventDefault();
        setErrorMessage("");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    national_id: nationalId,
                    phone_number: phone,
                    date_of_birth: dob,
                    address,
                    role: "user",
                },
            },
        });

        if (error) {
            setErrorMessage(error.message || "Unable to create your account. Please try again.");
            return;
        }

        if (data?.user) {
            alert("Account created successfully! Please sign in.");
            navigate("/user/login");
        }
    }

    return (
        <div className="user-signup-page">
            <div className="user-signup-card">
                <h3>Create Patient Account</h3>
                <p className="user-signup-subtitle">Register to manage your reservations</p>

                <form className="user-signup-form" onSubmit={handleSignUp}>
                    <label className="user-signup-field">
                        <span>Full Name</span>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            placeholder="Enter your full name"
                            required
                        />
                    </label>

                    <label className="user-signup-field">
                        <span>National ID</span>
                        <input
                            type="text"
                            value={nationalId}
                            onChange={(event) => setNationalId(event.target.value)}
                            placeholder="Enter your national ID"
                            required
                        />
                    </label>

                    <label className="user-signup-field">
                        <span>Phone</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="Enter your phone number"
                            required
                        />
                    </label>

                    <label className="user-signup-field">
                        <span>Date of Birth</span>
                        <input
                            type="date"
                            value={dob}
                            onChange={(event) => setDob(event.target.value)}
                            required
                        />
                    </label>

                    <label className="user-signup-field">
                        <span>Address</span>
                        <input
                            type="text"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="Enter your address"
                            required
                        />
                    </label>

                    <label className="user-signup-field">
                        <span>Email</span>
                        <div className="user-signup-input-wrapper">
                            <span className="user-signup-input-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 6h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
                                    <path d="m5 8 7 5 7-5" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </label>

                    <label className="user-signup-field">
                        <span>Password</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Create a password"
                            required
                        />
                    </label>

                    {errorMessage ? (
                        <p className="user-signup-error" role="alert">
                            {errorMessage}
                        </p>
                    ) : null}

                    <button type="submit">Sign Up</button>
                </form>
            </div>
        </div>
    );
}