import { Routes, Route } from "react-router-dom";

import LandingPage from "../Pages/LandingPage";
import UserLogin from "../Pages/UserLogin";
import UserSignUp from "../Pages/UserSignUp";
import PharmacyLogin from "../Pages/PharmacyLogin";
import PharmacySignUp from "../Pages/PharmacySignUp";
import AdminLogin from "../Pages/AdminLogin";
import AdminSignUp from "../Pages/AdminSignUp";

import UserLayout from "../layout/UserLayout";
import HomeUser from "../Pages/HomeUser";
import SearchUser from "../Pages/SearchUser";
import ReserveUser from "../Pages/ReserveUser";
import ProfileUser from "../Pages/ProfileUser";

// لاحظ: مسحنا الـ import بتاع MedicineBrowse لأنه هيتدمج جوه HomeUser

import PharmacyLayout from "../layout/PharmacyLayout";
import PharmacyDashboard from "../Pages/PharmacyDashboard";
import Inventory from "../Pages/Inventory";
import Analytics from "../Pages/Analytics";
import PharmacyReservation from "../Pages/PharmacyReservation";

import AdminLayout from "../layout/AdminLayout";
import Overview from "../Pages/Overview";
import ManageUser from "../Pages/ManageUser";
import PharmacyManagement from "../Pages/PharmacyManagement";

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

      <Route path="/user" element={<UserLayout />}>
        <Route index element={<HomeUser />} />
        <Route path="home" element={<HomeUser />} />
        <Route path="search" element={<SearchUser />} />
        <Route path="reservations" element={<ReserveUser />} />
        <Route path="profile" element={<ProfileUser />} />
      </Route>

      <Route path="/pharmacy" element={<PharmacyLayout />}>
        <Route index element={<PharmacyDashboard />} />
        <Route path="dashboard" element={<PharmacyDashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reservations" element={<PharmacyReservation />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Overview />} />
        <Route path="overview" element={<Overview />} />
        <Route path="users" element={<ManageUser />} />
        <Route path="pharmacies" element={<PharmacyManagement />} />
      </Route>
    </Routes>
  );
}