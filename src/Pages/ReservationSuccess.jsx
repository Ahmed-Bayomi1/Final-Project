import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

export default function ReservationSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useOutletContext() || {};
  const isSuccess = new URLSearchParams(location.search).get("success") === "true";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "320px",
      padding: "24px"
    }}>
      <div style={{
        maxWidth: "560px",
        width: "100%",
        background: "white",
        borderRadius: "18px",
        padding: "32px",
        boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "56px", marginBottom: "12px" }}>
          {isSuccess ? "✅" : "ℹ️"}
        </div>
        <h1 style={{ marginBottom: "12px", color: "#0f172a" }}>
          {isSuccess ? "Payment Successful" : "Reservation Complete"}
        </h1>
        <p style={{ color: "#475569", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" }}>
          Hi {user?.full_name || "there"}, your reservation has been confirmed and the payment was processed successfully.
          You can now view your bookings or return to the home page.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate("/user/reservations")}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "999px",
              padding: "12px 18px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            View My Reservations
          </button>
          <button
            type="button"
            onClick={() => navigate("/user/home")}
            style={{
              background: "#f8fafc",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: "999px",
              padding: "12px 18px",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
