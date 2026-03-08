import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus]       = useState("validating"); // validating | valid | invalid | success
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // ── Validate token as soon as page loads ──────────────────────────────────
  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    fetch(`${API_BASE}/api/auth/reset-password/validate?token=${token}`)
      .then(res => res.json())
      .then(data => setStatus(data.valid ? "valid" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  // ── Submit new password ────────────────────────────────────────────────────
  const submit = async () => {
    setError("");
    if (!password) { setError("Please enter a new password."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Something went wrong."); return; }
      setStatus("success");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength indicator ───────────────────────────────────────────
  const strength = (() => {
    if (!password) return null;
    if (password.length < 6) return { label: "Too short", color: "#E05050", width: "20%" };
    if (password.length < 8) return { label: "Weak", color: "#E08030", width: "40%" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Fair", color: "#D4B020", width: "65%" };
    return { label: "Strong", color: "#30A860", width: "100%" };
  })();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #FAF0FC 0%, #F0E0F8 100%)", padding: "24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;700&family=Nunito:wght@400;600;700;800&display=swap');`}</style>

      <div style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 24, padding: "48px 40px", boxShadow: "0 20px 60px rgba(216,94,130,0.10)" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <span style={{ fontSize: 24 }}>🌸</span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.pinkDark }}>SheCare</span>
        </div>

        {/* ── Validating ── */}
        {status === "validating" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft }}>Verifying your reset link…</p>
          </div>
        )}

        {/* ── Invalid / Expired ── */}
        {status === "invalid" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>
              Link expired
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.7, marginBottom: 28 }}>
              This password reset link is invalid or has expired. Reset links are only valid for 15 minutes.
            </p>
            <button onClick={() => navigate("/forgot-password")}
              style={{
                width: "100%", background: "linear-gradient(135deg, #E8709A 0%, #D85E82 50%, #B06898 100%)",
                color: "white", border: "none", borderRadius: 14, padding: "16px",
                fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(216,94,130,0.28)", marginBottom: 12,
              }}>
              Request New Link →
            </button>
            <button onClick={() => navigate("/auth")}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textSoft }}>
              ← Back to Sign In
            </button>
          </div>
        )}

        {/* ── Valid — show form ── */}
        {status === "valid" && (
          <>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: C.textDark, marginBottom: 8, letterSpacing: "-0.5px" }}>
              New password
            </h1>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.6, marginBottom: 28 }}>
              Choose a strong password. At least 8 characters with a mix of letters and numbers.
            </p>

            {error && (
              <div style={{ background: "#FEF0F4", border: "1px solid #F0C0D0", borderRadius: 12, padding: "11px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span>⚠️</span>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#A83060", fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {/* New password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 8 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textMid, letterSpacing: "0.8px", textTransform: "uppercase" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"} placeholder="8+ characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDark,
                    background: C.lilacPale, border: `1.5px solid ${C.border}`, borderRadius: 14,
                    padding: "14px 44px 14px 16px", outline: "none",
                  }}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textSoft, padding: 0 }}>
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Strength bar */}
            {strength && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ height: 4, background: "#F0E0F0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 4, transition: "all 0.3s" }} />
                </div>
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: strength.color, fontWeight: 700, marginTop: 4, display: "block" }}>{strength.label}</span>
              </div>
            )}

            {/* Confirm password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 24 }}>
              <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textMid, letterSpacing: "0.8px", textTransform: "uppercase" }}>Confirm Password</label>
              <input
                type="password" placeholder="Repeat your password"
                value={confirm} onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                style={{
                  fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDark,
                  background: confirm && confirm !== password ? "#FEF0F4" : C.lilacPale,
                  border: `1.5px solid ${confirm && confirm !== password ? "#F0C0D0" : C.border}`,
                  borderRadius: 14, padding: "14px 16px", outline: "none",
                  width: "100%", boxSizing: "border-box",
                }}
              />
              {confirm && confirm !== password && (
                <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#A83060", fontWeight: 600 }}>Passwords don't match</span>
              )}
            </div>

            <button onClick={submit} disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#E8C0D0" : "linear-gradient(135deg, #E8709A 0%, #D85E82 50%, #B06898 100%)",
                color: "white", border: "none", borderRadius: 14, padding: "16px",
                fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 8px 24px rgba(216,94,130,0.28)",
              }}>
              {loading ? "Resetting…" : "Reset Password →"}
            </button>
          </>
        )}

        {/* ── Success ── */}
        {status === "success" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: C.textDark, marginBottom: 12 }}>
              Password reset!
            </h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.7, marginBottom: 28 }}>
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <button onClick={() => navigate("/auth")}
              style={{
                width: "100%", background: "linear-gradient(135deg, #E8709A 0%, #D85E82 50%, #B06898 100%)",
                color: "white", border: "none", borderRadius: 14, padding: "16px",
                fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 8px 24px rgba(216,94,130,0.28)",
              }}>
              Sign In →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}