    import { Routes, Route } from "react-router-dom";

    import LandingPage from "../Pages/LandingPage";
    import UserLogin from "../Pages/UserLogin";
    import UserSignUp from "../Pages/UserSignUp";
    import PharmacyLogin from "../Pages/PharmacyLogin";
    import PharmacySignUp from "../Pages/PharmacySignUp";
    import AdminLogin from "../Pages/AdminLogin";
    import AdminSignUp from "../Pages/AdminSignUp";

    import { PATHS } from "./pathes";

    export default function AppRoutes() {
    return (
        <Routes>
        <Route path={PATHS.HOME} element={<LandingPage />} />

        <Route path={PATHS.USER_LOGIN} element={<UserLogin />} />
        <Route path={PATHS.USER_SIGNUP} element={<UserSignUp />} />

        <Route path={PATHS.PHARMACY_LOGIN} element={<PharmacyLogin />} />
        <Route path={PATHS.PHARMACY_SIGNUP} element={<PharmacySignUp />} />

        <Route path={PATHS.ADMIN_LOGIN} element={<AdminLogin />} />
        <Route path={PATHS.ADMIN_SIGNUP} element={<AdminSignUp />} />

        <Route path="/user" element={<Userlayout />}>
            <Route path="home" element={<HomeUser />} />
            <Route path="search" element={<SearchUser />} />
            <Route path="reservations" element={<ReserveUser />} />
            <Route path="profile" element={<ProfileUser />} />
        </Route>
        </Routes>
    );
    }