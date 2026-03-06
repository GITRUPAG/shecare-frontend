import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/Layout";
import { getProfile, updateProfile, uploadProfileImage } from "../api/profileService";
import { removeToken } from "../utils/tokenStorage";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     "#D85E82",
  primaryDark: "#B8456A",
  secondary:   "#603377",
  accent:      "#80468E",
  bgLight:     "#F3E6EE",
  white:       "#FFFFFF",
  textDark:    "#2C1028",
  textMid:     "#5A3060",
  textSoft:    "#9B7AAA",
  border:      "#E8C8D8",
  sand:        "#FDF6FA",
};

const TABS = ["Profile", "Health Info", "Notifications", "Privacy", "Account"];

// ─── Reusable components ──────────────────────────────────────────────────────

function Field({ label, type = "text", value, onChange, placeholder, readOnly }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>{label}</label>
      <input
        type={type} value={value ?? ""} onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder} readOnly={readOnly}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", border: `2px solid ${focused ? C.primary : C.border}`, borderRadius: 12, padding: "12px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDark, background: readOnly ? C.bgLight : C.sand, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: "block", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 6 }}>{label}</label>
      <select
        value={value ?? ""} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", border: `2px solid ${focused ? C.primary : C.border}`, borderRadius: 12, padding: "12px 14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textDark, background: C.sand, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: on ? C.primary : "#C8B0CC", cursor: "pointer", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: C.white, boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.3s" }} />
    </button>
  );
}

function Banner({ type, message }) {
  if (!message) return null;
  const s = {
    error:   { bg: "#FFF0F4", border: "#F4B8CB", icon: "⚠️", color: "#B8456A" },
    success: { bg: "#F0FDF4", border: "#A8E6C3", icon: "✅", color: "#1E7E4A" },
  }[type];
  return (
    <div style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span>{s.icon}</span>
      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: s.color, fontWeight: 600 }}>{message}</span>
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const navigate  = useNavigate();
  const fileRef   = useRef();

  const [tab,      setTab]      = useState("Profile");
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [imgUp,    setImgUp]    = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  // ── Load profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    getProfile()
      .then(data => setProfile(data))
      .catch(() => setFeedback({ type: "error", msg: "Could not load profile. Please try again." }))
      .finally(() => setLoading(false));
  }, []);

  const upd = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  // ── Save profile ─────────────────────────────────────────────────────────
  const saveChanges = async () => {
    setSaving(true);
    setFeedback({ type: "", msg: "" });
    try {
      const updated = await updateProfile(profile);
      setProfile(updated);
      setFeedback({ type: "success", msg: "Changes saved successfully! ✓" });
      setTimeout(() => setFeedback({ type: "", msg: "" }), 3000);
    } catch (e) {
      setFeedback({ type: "error", msg: e?.response?.data?.message || "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  // ── Upload profile image ─────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUp(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const updated = await uploadProfileImage(fd);
      setProfile(updated);
      setFeedback({ type: "success", msg: "Profile photo updated!" });
      setTimeout(() => setFeedback({ type: "", msg: "" }), 2500);
    } catch {
      setFeedback({ type: "error", msg: "Image upload failed." });
    } finally {
      setImgUp(false);
    }
  };

  // ── Sign out ─────────────────────────────────────────────────────────────
  const handleSignOut = () => {
  removeToken();                           // removes "shecare_token"
  localStorage.removeItem("shecare_user");
  navigate("/login");
};

  const card = { background: C.white, borderRadius: 24, padding: "28px 32px", border: `1px solid ${C.border}`, boxShadow: "0 2px 16px rgba(96,51,119,0.07)" };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell current="profile">
        <div style={{ padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft }}>Loading profile…</p>
        </div>
      </AppShell>
    );
  }

  const displayName = profile?.fullName || profile?.username || "You";
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <AppShell current="profile">
      <div style={{ padding: "32px 36px", maxWidth: 1000 }}>

        {/* Feedback banner */}
        <Banner type={feedback.type} message={feedback.msg} />

        {/* ── Hero ── */}
        <div style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, borderRadius: 28, padding: "32px 36px", marginBottom: 28, display: "flex", alignItems: "center", gap: 24, color: C.white, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, background: "rgba(128,70,142,0.25)", filter: "blur(50px)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: -40, left: 100, width: 160, height: 160, background: "rgba(216,94,130,0.2)", filter: "blur(40px)", borderRadius: "50%" }} />

          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="avatar" style={{ width: 80, height: 80, borderRadius: 20, objectFit: "cover", border: "3px solid rgba(255,255,255,0.4)" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 20, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 700, color: C.white }}>
                {initial}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
            <button onClick={() => fileRef.current?.click()} disabled={imgUp} style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: C.white, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.primary, fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
              {imgUp ? "…" : "✏"}
            </button>
          </div>

          {/* Info */}
          <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{displayName}</h2>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, opacity: 0.8, marginBottom: 10 }}>{profile?.email || "—"}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {profile?.city && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>📍 {profile.city}</span>}
              {profile?.bloodGroup && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>🩸 {profile.bloodGroup}</span>}
              {profile?.activityLevel && <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: 20 }}>💪 {profile.activityLevel}</span>}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, textAlign: "center", position: "relative", zIndex: 2 }}>
            {[
              [profile?.age ?? "—",    "Age"],
              [profile?.height ? `${profile.height}cm` : "—", "Height"],
              [profile?.weight ? `${profile.weight}kg` : "—", "Weight"],
            ].map(([v, l]) => (
              <div key={l}>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700 }}>{v}</p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, opacity: 0.75 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, background: C.bgLight, borderRadius: 16, padding: 4, marginBottom: 28, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "11px 20px", borderRadius: 12, border: "none", whiteSpace: "nowrap",
              background: tab === t ? C.white : "transparent",
              color: tab === t ? C.textDark : C.textSoft,
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: tab === t ? `0 2px 10px rgba(96,51,119,0.12)` : "none",
            }}>{t}</button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "Profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark }}>Personal Information</h2>
              <Field label="Full Name"      value={profile?.fullName}   onChange={v => upd("fullName", v)}   placeholder="Your full name" />
              <Field label="Date of Birth"  type="date" value={profile?.dateOfBirth} onChange={v => upd("dateOfBirth", v)} />
              <SelectField label="Gender" value={profile?.gender} onChange={v => upd("gender", v)} options={["Female","Male","Non-binary","Prefer not to say"]} />
              <Field label="Age"  type="number" value={profile?.age}    onChange={v => upd("age", +v)}   placeholder="Your age" />
              <Field label="City"    value={profile?.city}    onChange={v => upd("city", v)}    placeholder="City" />
              <Field label="State"   value={profile?.state}   onChange={v => upd("state", v)}   placeholder="State" />
              <Field label="Country" value={profile?.country} onChange={v => upd("country", v)} placeholder="Country" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>Body Metrics</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Height (cm)" type="number" value={profile?.height}  onChange={v => upd("height", +v)}  placeholder="e.g. 162" />
                  <Field label="Weight (kg)" type="number" value={profile?.weight}  onChange={v => upd("weight", +v)}  placeholder="e.g. 58" />
                  <SelectField label="Blood Group" value={profile?.bloodGroup} onChange={v => upd("bloodGroup", v)} options={["A+","A-","B+","B-","O+","O-","AB+","AB-"]} />
                </div>
              </div>

              <div style={card}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>Emergency Contact</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Contact Name"   value={profile?.emergencyContactName}   onChange={v => upd("emergencyContactName", v)}   placeholder="Name" />
                  <Field label="Contact Number" value={profile?.emergencyContactNumber} onChange={v => upd("emergencyContactNumber", v)} placeholder="Phone number" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HEALTH INFO TAB ── */}
        {tab === "Health Info" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark }}>Medical Conditions</h2>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginTop: -8 }}>Improves your AI health recommendations</p>
              {[
                { key: "hasPCOS",         label: "PCOS",         desc: "Polycystic Ovary Syndrome" },
                { key: "hasDiabetes",     label: "Diabetes",     desc: "Type 1 or Type 2" },
                { key: "hasThyroid",      label: "Thyroid",      desc: "Hypo or Hyperthyroidism" },
                { key: "hasHypertension", label: "Hypertension", desc: "High blood pressure" },
              ].map((c, i, arr) => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: i < arr.length - 1 ? 14 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${C.bgLight}` : "none" }}>
                  <div>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textDark }}>{c.label}</p>
                    <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft }}>{c.desc}</p>
                  </div>
                  <Toggle on={!!profile?.[c.key]} onToggle={() => upd(c.key, !profile?.[c.key])} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={card}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 16 }}>Lifestyle</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <SelectField label="Activity Level" value={profile?.activityLevel} onChange={v => upd("activityLevel", v)}
                    options={["Sedentary","Lightly Active","Moderately Active","Very Active","Athlete"]} />
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Smoker</p>
                      <Toggle on={!!profile?.smoker} onToggle={() => upd("smoker", !profile?.smoker)} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textMid, marginBottom: 8 }}>Alcohol</p>
                      <Toggle on={!!profile?.alcoholic} onToggle={() => upd("alcoholic", !profile?.alcoholic)} />
                    </div>
                  </div>
                </div>
              </div>

              {/* BMI card if height + weight available */}
              {profile?.height && profile?.weight && (() => {
                const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1);
                const cat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";
                const catColor = { Underweight: "#2563EB", Normal: "#16A34A", Overweight: "#D97706", Obese: "#DC2626" }[cat];
                const pct = Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));
                return (
                  <div style={{ ...card }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>BMI Calculator</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 700, color: catColor, lineHeight: 1 }}>{bmi}</p>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, padding: "5px 14px", borderRadius: 20, background: `${catColor}18`, color: catColor }}>{cat}</span>
                    </div>
                    <div style={{ height: 8, background: C.bgLight, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, #2563EB, #16A34A, #D97706, #DC2626)`, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.textSoft }}>10</span>
                      <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: C.textSoft }}>40</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {tab === "Notifications" && (
          <div style={{ maxWidth: 520 }}>
            <div style={card}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark, marginBottom: 8 }}>Notification Preferences</h2>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginBottom: 24 }}>Synced with your profile settings</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { key: "notificationsEnabled", label: "All Notifications", desc: "Master toggle for all app notifications" },
                ].map((n, i, arr) => (
                  <div key={n.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.bgLight}` : "none" }}>
                    <div>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textDark }}>{n.label}</p>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, marginTop: 2 }}>{n.desc}</p>
                    </div>
                    <Toggle on={!!profile?.[n.key]} onToggle={() => upd(n.key, !profile?.[n.key])} />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: "14px 16px", background: C.bgLight, borderRadius: 12 }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft }}>
                  💡 More granular notification settings (period reminders, ovulation alerts, etc.) can be configured in your device settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── PRIVACY TAB ── */}
        {tab === "Privacy" && (
          <div style={{ maxWidth: 520, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={card}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark, marginBottom: 22 }}>Privacy Controls</h2>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
                <div>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textDark }}>Dark Mode</p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, marginTop: 2 }}>Enable dark theme across the app</p>
                </div>
                <Toggle on={!!profile?.darkModeEnabled} onToggle={() => upd("darkModeEnabled", !profile?.darkModeEnabled)} />
              </div>
            </div>
            <div style={{ background: C.bgLight, borderRadius: 22, padding: "24px 28px", border: `1px solid ${C.border}` }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.secondary, marginBottom: 12 }}>🔐 SheCare Privacy Promise</h3>
              {["Your health data is end-to-end encrypted","We never sell your data to third parties","Community posts are always anonymous","Delete your account & all data at any time","GDPR compliant data protection"].map(p => (
                <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: C.primary, flexShrink: 0 }}>✓</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textMid }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {tab === "Account" && (
          <div style={{ maxWidth: 500 }}>
            <div style={card}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark, marginBottom: 18 }}>Account Actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "📥", label: "Export My Data",   desc: "Download all your health data as CSV",  c: C.textDark,    hover: C.bgLight,   action: null },
                  { icon: "🔑", label: "Change Password",  desc: "Update your account password",          c: C.textDark,    hover: C.bgLight,   action: null },
                  { icon: "🚪", label: "Sign Out",         desc: "Sign out of this device",               c: "#D97706",     hover: "#FFFBEB",   action: handleSignOut },
                  { icon: "🗑",  label: "Delete Account",  desc: "Permanently delete account & data",     c: C.primaryDark, hover: "#FFF0F4",   action: null },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 14, border: `1px solid ${C.border}`, background: C.white, cursor: a.action ? "pointer" : "not-allowed", opacity: a.action ? 1 : 0.55, transition: "background 0.2s", width: "100%", textAlign: "left" }}
                    onMouseEnter={e => { if (a.action) e.currentTarget.style.background = a.hover; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.white; }}
                  >
                    <span style={{ fontSize: 20 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: a.c }}>{a.label}</p>
                      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, marginTop: 2 }}>{a.desc}</p>
                    </div>
                    <span style={{ color: C.textSoft }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Save button (Profile + Health Info tabs) ── */}
        {["Profile", "Health Info", "Notifications", "Privacy"].includes(tab) && (
          <div style={{ marginTop: 24 }}>
            <button onClick={saveChanges} disabled={saving} style={{
              background: saving ? C.border : `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              color: C.white, border: "none", borderRadius: 14, padding: "14px 32px",
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: saving ? "none" : "0 4px 16px rgba(96,51,119,0.30)",
              transition: "all 0.3s",
            }}>
              {saving ? "Saving…" : "Save Changes →"}
            </button>
          </div>
        )}

      </div>
    </AppShell>
  );
}