import { Outlet } from "react-router-dom";
import PharmacyNavbar from "../components/PharmacyNavbar";

function PharmacyLayout() {
  return (
    <>
      <PharmacyNavbar />
      <Outlet />
    </>
  );
}

export default PharmacyLayout;