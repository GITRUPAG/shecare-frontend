import { useState } from "react";
import { useNavigate } from "react-router-dom";

const C = {
  pink:      "#D85E82",
  pinkDark:  "#B8456A",
  pinkLight: "#F0A8C0",
  lilacPale: "#FAF0FC",
  textDark:  "#3D1A50",
  textMid:   "#6B4080",
  textSoft:  "#A880B8",
  border:    "#E8D0F0",
};

//const API_BASE = "https://shecare-backend-1061624847334.asia-south1.run.app";
const API_BASE = "https://shecare-backend-flui.onrender.com";


export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show success — never reveal if email exists
      setSent(true);
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #FAF0FC 0%, #F0E0F8 100%)", padding: "24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 24, padding: "48px 40px", boxShadow: "0 20px 60px rgba(216,94,130,0.10)" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <span style={{ fontSize: 24 }}>🌸</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.pinkDark }}>SheCare</span>
        </div>

        {!sent ? (
          <>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: C.textDark, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Forgot password?
            </h1>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.6, marginBottom: 28 }}>
              No worries! Enter your email and we'll send you a reset link valid for 15 minutes.
            </p>

            {/* Error */}
            {error && (
              <div style={{ background: "#FEF0F4", border: "1px solid #F0C0D0", borderRadius: 12, padding: "11px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span>⚠️</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#A83060", fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {/* Email input */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textMid, letterSpacing: "0.8px", textTransform: "uppercase" }}>Email Address</label>
              <input
                type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                style={{
                  fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDark,
                  background: C.lilacPale, border: `1.5px solid ${C.border}`, borderRadius: 14,
                  padding: "14px 16px", outline: "none", width: "100%", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit */}
            <button onClick={submit} disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#E8C0D0" : "linear-gradient(135deg, #E8709A 0%, #D85E82 50%, #B06898 100%)",
                color: "white", border: "none", borderRadius: 14, padding: "16px",
                fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 8px 24px rgba(216,94,130,0.28)",
                marginBottom: 16,
              }}>
              {loading ? "Sending…" : "Send Reset Link →"}
            </button>
          </>
        ) : (
          /* ✅ Success state */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>
              Check your inbox!
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.7, marginBottom: 28 }}>
              If <strong style={{ color: C.textMid }}>{email}</strong> is registered with SheCare, you'll receive a reset link shortly.
              <br /><br />
              Don't forget to check your spam folder.
            </p>
            <button onClick={() => navigate("/auth")}
              style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 12, padding: "12px 24px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textMid, cursor: "pointer" }}>
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* Back to login */}
        {!sent && (
          <button onClick={() => navigate("/auth")}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textSoft, display: "block", margin: "0 auto" }}>
            ← Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}