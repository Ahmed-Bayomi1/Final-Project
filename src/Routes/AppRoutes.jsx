    import { Routes, Route } from "react-router-dom";

    import LandingPage from "../Pages/LandingPage";
    import UserLogin from "../Pages/UserLogin";
    import UserSignUp from "../Pages/UserSignUp";
    import PharmacyLogin from "../Pages/PharmacyLogin";
    import PharmacySignUp from "../Pages/PharmacySignUp";
    import AdminLogin from "../Pages/AdminLogin";
    import AdminSignUp from "../Pages/AdminSignUp";

    import MainLayout from "../Layout/MainLayout";

    import Home from "../Pages/Home";
    import Search from "../Pages/Search";
    import Reserve from "../Pages/Reserve";
    import Profile from "../Pages/Profile";

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

        <Route element={<MainLayout />}>
            <Route path={PATHS.DASHBOARD} element={<Home />} />
            <Route path={PATHS.SEARCH} element={<Search />} />
            <Route path={PATHS.RESERVE} element={<Reserve />} />
            <Route path={PATHS.PROFILE} element={<Profile />} />
        </Route>
        </Routes>
    );
    }