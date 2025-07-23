import React from "react";
import { useNavigate } from "react-router-dom";

const Student = () => {
  const navigate = useNavigate();
  const handleBackToHome = () => {
    localStorage.removeItem('googleUser');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('roleAccess');
    localStorage.removeItem('privileges');
    navigate("/auth");
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff8f0" }}>
      <h1 style={{ fontSize: "2.5rem", color: "#ff6600", marginBottom: "1rem" }}>Student Page</h1>
      <p style={{ fontSize: "1.2rem", color: "#333", marginBottom: "2rem" }}>
        You have been redirected here. If you believe this is a mistake, please contact the administrator.
      </p>
      <button
        style={{
          padding: "0.75rem 2rem",
          background: "#ff6600",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          transition: "background 0.2s"
        }}
        onClick={handleBackToHome}
      >
        Back to Home
      </button>
    </div>
  );
};

export default Student; 