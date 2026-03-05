import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken } from "../utils/tokenStorage";

const C = {
  pink:       "#D85E82",
  pinkDark:   "#B8456A",
  pinkLight:  "#F0A8C0",
  purple:     "#80468E",
  purpleMid:  "#9B6AAE",
  lilac:      "#C8A0D8",
  lilacLight: "#EDD8F5",
  lilacPale:  "#FAF0FC",
  textDark:   "#3D1A50",
  textMid:    "#6B4080",
  textSoft:   "#A880B8",
  border:     "#E8D0F0",
};

const API_BASE = "https://shecare-backend-1061624847334.asia-south1.run.app";

async function apiLogin(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.error || "Invalid credentials.");
  return data;
}

async function apiRegister(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text)?.message || text; } catch {}
    throw new Error(msg || "Registration failed.");
  }
  return text;
}

function InputField({ label, type = "text", placeholder, value, onChange, icon }) {
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputType = type === "password" ? (showPwd ? "text" : "password") : type;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <label style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textMid, letterSpacing: "0.8px", textTransform: "uppercase" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: focused ? 0.9 : 0.45, transition: "opacity 0.2s" }}>{icon}</span>}
        <input
          type={inputType} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDark,
            background: focused ? "#fff" : C.lilacPale,
            border: `1.5px solid ${focused ? C.pink : C.border}`,
            borderRadius: 14,
            padding: `14px 16px 14px ${icon ? "44px" : "16px"}`,
            paddingRight: type === "password" ? "44px" : "16px",
            outline: "none", transition: "all 0.22s",
            boxShadow: focused ? "0 0 0 4px rgba(216,94,130,0.08)" : "none",
          }}
        />
        {type === "password" && (
          <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.textSoft, padding: 0 }}>
            {showPwd ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const cfg = {
    error:   { bg: "#FEF0F4", border: "#F0C0D0", text: "#A83060", icon: "⚠️" },
    success: { bg: "#F0FBF4", border: "#A8DFC0", text: "#1A6B40", icon: "✓" },
  }[type];
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: "11px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 14 }}>{cfg.icon}</span>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: cfg.text, fontWeight: 600 }}>{msg}</span>
    </div>
  );
}

function SubmitButton({ loading, children, onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(216,94,130,0.40)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = loading ? "none" : "0 8px 24px rgba(216,94,130,0.28)"; }}
      style={{
        width: "100%",
        background: loading ? "#E8C0D0" : "linear-gradient(135deg, #E8709A 0%, #D85E82 50%, #B06898 100%)",
        color: "white", border: "none", borderRadius: 14, padding: "16px",
        fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 800,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: loading ? "none" : "0 8px 24px rgba(216,94,130,0.28)",
        transition: "all 0.25s", letterSpacing: "0.3px",
      }}
    >{children}</button>
  );
}

function SocialButton({ icon, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        border: `1.5px solid ${hov ? C.pinkLight : C.border}`, borderRadius: 12,
        padding: "12px 16px", background: hov ? "#FEF4F8" : "white",
        fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textMid,
        cursor: "pointer", transition: "all 0.2s",
      }}
    ><span>{icon}</span>{label}</button>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [id, setId]           = useState("");
  const [pwd, setPwd]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const submit = async () => {
    setError("");
    if (!id.trim() || !pwd) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const data = await apiLogin(id.trim(), pwd);
      saveToken(data.token);
      localStorage.setItem("shecare_user", JSON.stringify({ name: data.name, role: data.role, username: data.username }));
      navigate("/dashboard");
    } catch (err) { setError(err.message || "Unable to connect to server."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Alert type="error" msg={error} />
      <InputField label="Email or Username" placeholder="you@example.com" value={id} onChange={setId} icon="✉️" />
      <InputField label="Password" type="password" placeholder="Your password" value={pwd} onChange={setPwd} icon="🔒" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" style={{ accentColor: C.pink, width: 15, height: 15 }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft }}>Keep me signed in</span>
        </label>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.pink }}>Forgot password?</button>
      </div>
      <SubmitButton loading={loading} onClick={submit}>{loading ? "Signing in…" : "Sign In →"}</SubmitButton>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, fontWeight: 600 }}>or</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <SocialButton icon="🌐" label="Google" />
        <SocialButton icon="🍎" label="Apple" />
      </div>
    </div>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ username: "", email: "", phoneNumber: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(""); setSuccess("");
    const { username, email, phoneNumber, password } = form;
    if (!username.trim() || !email.trim() || !phoneNumber.trim() || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      await apiRegister({ username: username.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), password });
      setSuccess("Account created! Redirecting…");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) { setError(err.message || "Unable to connect."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Alert type="error" msg={error} />
      <Alert type="success" msg={success} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <InputField label="Username" placeholder="yourname" value={form.username} onChange={v => set("username", v)} icon="👤" />
        <InputField label="Phone" type="tel" placeholder="9876543000" value={form.phoneNumber} onChange={v => set("phoneNumber", v)} icon="📱" />
      </div>
      <InputField label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={v => set("email", v)} icon="✉️" />
      <InputField label="Password" type="password" placeholder="8+ characters" value={form.password} onChange={v => set("password", v)} icon="🔒" />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "linear-gradient(135deg, #FEF4F8, #F8F0FC)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}>
        <span style={{ fontSize: 17, flexShrink: 0, marginTop: 1 }}>🔐</span>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, lineHeight: 1.65, margin: 0 }}>
          <strong style={{ color: C.pinkDark }}>Your privacy is sacred.</strong> All data is encrypted, never sold, and your community presence is always anonymous.
        </p>
      </div>
      <SubmitButton loading={loading} onClick={submit}>{loading ? "Creating account…" : "Create Account →"}</SubmitButton>
    </div>
  );
}

function LeftPanel() {
  return (
    <div style={{
      width: "45vw", minHeight: "100vh", position: "relative", overflow: "hidden",
      background: "linear-gradient(150deg, #F9EEF6 0%, #EED5F5 35%, #E0B8EC 65%, #D490C8 100%)",
      display: "flex", flexDirection: "column", padding: "44px 48px", flexShrink: 0,
    }}>
      {/* Soft blobs */}
      <div style={{ position: "absolute", top: -100, right: -60, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,94,130,0.22), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -60, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(176,102,192,0.20), transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "45%", right: "12%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.40), transparent 70%)", pointerEvents: "none" }} />
      {/* Decorative rings */}
      <div style={{ position: "absolute", top: 60, right: 30, width: 150, height: 150, borderRadius: "50%", border: "1px solid rgba(216,94,130,0.15)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 36, right: 6, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(216,94,130,0.08)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 90, left: 30, width: 90, height: 90, borderRadius: "50%", border: "1px solid rgba(176,102,192,0.18)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ position: "relative", zIndex: 3, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.55)", border: "1px solid rgba(216,94,130,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌸</div>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.pinkDark }}>SheCare</span>
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 3, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 24 }}>

        {/* Trust badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22, background: "rgba(255,255,255,0.55)", borderRadius: 50, padding: "7px 16px", border: "1px solid rgba(216,94,130,0.20)", width: "fit-content", backdropFilter: "blur(8px)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.pink }} />
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.pinkDark, letterSpacing: "0.8px", textTransform: "uppercase" }}>Trusted by 12,000+ Women</span>
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 3vw, 52px)", fontWeight: 700, color: C.textDark, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 16 }}>
          Your health<br />journey<br />
          <span style={{ fontStyle: "italic", color: C.pink }}>starts here.</span>
        </h2>

        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textMid, lineHeight: 1.78, marginBottom: 28, maxWidth: 320, opacity: 0.85 }}>
          AI-powered cycle predictions, PCOS early detection, and a warm anonymous community — all in one place.
        </p>

        {/* Feature cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 32 }}>
          {[
            { icon: "🧠", text: "AI Period Prediction", sub: "94% accuracy" },
            { icon: "🧬", text: "PCOS Risk Screening", sub: "Under 3 minutes" },
            { icon: "🌿", text: "Phase-based Wellness Tips", sub: "Daily insights" },
            { icon: "🔐", text: "100% Private & Encrypted", sub: "Zero data sold" },
          ].map(f => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 13, background: "rgba(255,255,255,0.50)", border: "1px solid rgba(216,94,130,0.12)", borderRadius: 14, padding: "11px 15px", backdropFilter: "blur(6px)" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textDark, margin: 0, lineHeight: 1.3 }}>{f.text}</p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft, margin: "2px 0 0" }}>{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10 }}>
          {[["94%", "Accuracy"], ["12K+", "Women"], ["< 3min", "Screening"]].map(([v, l]) => (
            <div key={l} style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.50)", borderRadius: 14, padding: "14px 6px", border: "1px solid rgba(216,94,130,0.14)" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: C.pink, lineHeight: 1, margin: "0 0 3px" }}>{v}</p>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.textSoft, margin: 0 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft, position: "relative", zIndex: 3, margin: 0, opacity: 0.7 }}>
        Launching March 8, 2025 · International Women's Day
      </p>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "register" ? "register" : "login");

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#FFFFFF" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400;1,700&family=Nunito:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #C0A0CC; }
        @media (max-width: 820px) {
          .auth-left  { display: none !important; }
          .auth-right { padding: 32px 24px !important; }
          .mobile-logo { display: flex !important; }
        }
      `}</style>

      <div className="auth-left"><LeftPanel /></div>

      <div className="auth-right" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 56px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          <button onClick={() => navigate("/")} className="mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", marginBottom: 36 }}>
            <span style={{ fontSize: 24 }}>🌸</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.pinkDark }}>SheCare</span>
          </button>

          <button onClick={() => navigate("/")}
            onMouseEnter={e => e.currentTarget.style.color = C.pink}
            onMouseLeave={e => e.currentTarget.style.color = C.textSoft}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", marginBottom: 36, padding: 0, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textSoft, transition: "color 0.2s" }}>
            ← Back to home
          </button>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 700, lineHeight: 1.1, color: C.textDark, marginBottom: 8, letterSpacing: "-0.5px" }}>
              {tab === "login" ? "Welcome back" : "Join SheCare"}
              <span style={{ color: C.pink }}> 🌸</span>
            </h1>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: C.textSoft, lineHeight: 1.6 }}>
              {tab === "login" ? "Sign in to continue your wellness journey." : "Create your free account and start tracking today."}
            </p>
          </div>

          <div style={{ display: "flex", background: C.lilacPale, borderRadius: 16, padding: 5, marginBottom: 28, border: `1px solid ${C.border}` }}>
            {[["login", "Sign In"], ["register", "Create Account"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "11px 8px", borderRadius: 12, border: "none",
                background: tab === t ? "white" : "transparent",
                color: tab === t ? C.textDark : C.textSoft,
                fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800,
                cursor: "pointer", transition: "all 0.22s",
                boxShadow: tab === t ? "0 2px 12px rgba(216,94,130,0.10)" : "none",
              }}>{label}</button>
            ))}
          </div>

          {tab === "login" ? <LoginForm /> : <RegisterForm />}

          <p style={{ textAlign: "center", fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, marginTop: 24 }}>
            {tab === "login" ? "New to SheCare? " : "Already have an account? "}
            <button onClick={() => setTab(tab === "login" ? "register" : "login")} style={{ background: "none", border: "none", cursor: "pointer", color: C.pink, fontWeight: 800, fontFamily: "'Nunito', sans-serif", fontSize: 14 }}>
              {tab === "login" ? "Create account" : "Sign in instead"}
            </button>
          </p>

          <p style={{ textAlign: "center", fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft, marginTop: 16, lineHeight: 1.6 }}>
            By continuing you agree to our{" "}
            <span style={{ color: C.pink, cursor: "pointer", fontWeight: 700 }}>Terms</span>{" & "}
            <span style={{ color: C.pink, cursor: "pointer", fontWeight: 700 }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}