import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/Layout";
import { predictPCOS, savePcosSymptoms } from "../api/periodService";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     "#D85E82",
  primaryDark: "#B8456A",
  primaryGlow: "rgba(216,94,130,0.18)",
  secondary:   "#603377",
  accent:      "#80468E",
  bgLight:     "#F3E6EE",
  white:       "#FFFFFF",
  textDark:    "#2C1028",
  textMid:     "#5A3060",
  textSoft:    "#9B7AAA",
  border:      "#E8C8D8",
  sand:        "#FDF6FA",
  grad:        "linear-gradient(135deg, #D85E82, #603377)",
};

// ─── Risk level colour map ────────────────────────────────────────────────────
const RISK = {
  low: {
    emoji: "✅", label: "Low Risk",
    color: "#16A34A", bg: "#F0FDF4", border: "#86EFAC", text: "#15803D",
  },
  moderate: {
    emoji: "⚠️", label: "Moderate Risk",
    color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", text: "#92400E",
  },
  high: {
    emoji: "🔴", label: "Elevated Risk",
    color: "#DC2626", bg: "#FEF2F2", border: "#FCA5A5", text: "#991B1B",
  },
};

const resolveRisk = (apiRes) => {
  const key = (apiRes?.risk_level ?? "").toLowerCase();
  if (key.includes("high"))     return RISK.high;
  if (key.includes("moderate")) return RISK.moderate;
  return RISK.low;
};

// ─── Symptom questions (yes/no) ───────────────────────────────────────────────
const SYMPTOMS = [
  { key: "weight_gain",    icon: "⚖️", label: "Unexplained weight gain",      hint: "Gained weight without a clear dietary change" },
  { key: "hair_growth",    icon: "🌿", label: "Excess facial / body hair",     hint: "Hair on face, chest or back beyond what's normal for you" },
  { key: "skin_darkening", icon: "🩺", label: "Dark skin patches",            hint: "Darkening on neck, armpits or groin (acanthosis nigricans)" },
  { key: "pimples",        icon: "✨", label: "Persistent acne or oily skin",  hint: "Hormonal acne, especially along the chin and jaw" },
];

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, borderRadius: 22,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 16px rgba(96,51,119,0.07)",
      padding: "24px 20px",
      width: "100%", boxSizing: "border-box",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Pill ─────────────────────────────────────────────────────────────────────
function Pill({ children, color = C.primary, bg = C.bgLight }) {
  return (
    <span style={{
      fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800,
      padding: "4px 12px", borderRadius: 20, background: bg, color,
      letterSpacing: "0.4px",
    }}>
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ label = "Loading…" }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>🧬</div>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: C.textDark, marginBottom: 6 }}>{label}</p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft }}>Hang tight…</p>
    </div>
  );
}

// ─── Yes / No symptom toggle ──────────────────────────────────────────────────
function SymptomToggle({ symptom, value, onChange }) {
  return (
    <div style={{
      background: value === 1 ? C.bgLight : "#F9F9FB",
      border: `2px solid ${value === 1 ? C.primary : C.border}`,
      borderRadius: 16, padding: "14px 16px",
      transition: "all 0.2s", cursor: "default",
      boxSizing: "border-box", width: "100%",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textDark, marginBottom: 3 }}>
            <span style={{ marginRight: 8 }}>{symptom.icon}</span>{symptom.label}
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>{symptom.hint}</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {[{ val: 0, label: "No" }, { val: 1, label: "Yes" }].map(opt => (
            <button key={opt.val} onClick={() => onChange(opt.val)} style={{
              padding: "7px 14px", borderRadius: 10, border: "none",
              background: value === opt.val
                ? (opt.val === 1 ? C.grad : "#EEF0F4")
                : "#F3F4F6",
              color: value === opt.val
                ? (opt.val === 1 ? C.white : C.textDark)
                : C.textSoft,
              fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.18s",
              boxShadow: value === opt.val && opt.val === 1 ? `0 2px 10px ${C.primaryGlow}` : "none",
            }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Result panel ─────────────────────────────────────────────────────────────
function ResultPanel({ result, isAuto, onRefine, onRetake, showRefineBtn }) {
  const isMobile = useIsMobile();
  const risk    = resolveRisk(result);
  const prob    = result?.pcos_probability ?? null;
  const factors = result?.top_risk_factors ?? [];
  const rec     = result?.recommendation   ?? "";
  const interp  = result?.interpretation   ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Hero ── */}
      <div style={{
        background: risk.bg,
        border: `2px solid ${risk.border}`,
        borderRadius: 24, padding: isMobile ? "22px 18px" : "32px 36px",
        boxSizing: "border-box", width: "100%",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? 14 : 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: isMobile ? 44 : 58, lineHeight: 1 }}>{risk.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textSoft, textTransform: "uppercase", letterSpacing: "1.2px" }}>
                PCOS Risk Assessment
              </p>
              {isAuto && <Pill color={C.secondary} bg="#F5F3FF">⚡ Auto-assessed</Pill>}
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 32 : 42, fontWeight: 700, color: risk.text, lineHeight: 1, marginBottom: 10 }}>
              {risk.label}
            </h2>
            {prob !== null && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: risk.text }}>PCOS Probability</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 800, color: risk.text }}>{Math.round(prob * 100)}%</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.6)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.8)", overflow: "hidden" }}>
                  <div style={{ width: `${prob * 100}%`, height: "100%", background: risk.color, borderRadius: 4, transition: "width 1.2s ease" }} />
                </div>
              </div>
            )}
            {interp && (
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textMid, lineHeight: 1.75 }}>{interp}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recommendation + Risk Factors ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {rec && (
          <Card>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>📋 Recommendation</h3>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textMid, lineHeight: 1.8 }}>{rec}</p>
          </Card>
        )}
        {factors.length > 0 && (
          <Card>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>🔍 Top Risk Factors</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {factors.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.bgLight, border: `2px solid ${C.border}`, color: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'Nunito', sans-serif", fontSize: 10, fontWeight: 800 }}>{i + 1}</div>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textMid, lineHeight: 1.6, paddingTop: 1 }}>{f}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* ── Disclaimer ── */}
      {result?.disclaimer && (
        <div style={{ background: "#F8F8FA", borderRadius: 14, padding: "14px 18px", border: "1px solid #E8E8EF", boxSizing: "border-box" }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#888", lineHeight: 1.7 }}>
            ⚕️ {result.disclaimer}
          </p>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {showRefineBtn && (
          <button onClick={onRefine} style={{
            flex: isMobile ? 1 : "none",
            background: C.grad, color: C.white, border: "none", borderRadius: 12,
            padding: "13px 24px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}`,
          }}>
            ✏️ Refine with Symptoms →
          </button>
        )}
        <button onClick={onRetake} style={{
          flex: isMobile ? 1 : "none",
          border: `2px solid ${C.border}`, borderRadius: 12, padding: "13px 24px",
          background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
          color: C.textSoft, cursor: "pointer",
        }}>
          🔄 Re-assess
        </button>
      </div>
    </div>
  );
}

// ─── Data required banner ─────────────────────────────────────────────────────
function DataRequiredBanner({ message, onGoToProfile, onGoToTracker }) {
  return (
    <div style={{
      background: "#FFFBEB", border: "1.5px solid #FCD34D",
      borderRadius: 18, padding: "20px 22px", marginBottom: 20,
      boxSizing: "border-box",
    }}>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: "#92400E", marginBottom: 12 }}>
        ⚠️ {message}
      </p>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: "#78350F", marginBottom: 10 }}>
        To run PCOS risk assessment, please:
      </p>
      <ul style={{ margin: "0 0 18px 0", padding: "0 0 0 4px", listStyle: "none" }}>
        {["Add your age, height, and weight in Profile", "Log at least one period cycle"].map(item => (
          <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#92400E", lineHeight: 1.55 }}>
            <span style={{ color: "#D97706", marginTop: 1 }}>•</span>
            {item}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onGoToProfile} style={{ background: C.grad, color: C.white, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 14px ${C.primaryGlow}` }}>
          👤 Complete Profile
        </button>
        <button onClick={onGoToTracker} style={{ background: C.white, color: C.textMid, border: `2px solid ${C.border}`, borderRadius: 10, padding: "10px 20px", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          🩸 Log Period
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PCOSPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [view,         setView]         = useState("loading");
  const [autoResult,   setAutoResult]   = useState(null);
  const [manualResult, setManualResult] = useState(null);
  const [symptoms,     setSymptoms]     = useState({
    weight_gain: 0, hair_growth: 0, skin_darkening: 0, pimples: 0,
  });
  const [error,     setError]     = useState("");
  const [autoError, setAutoError] = useState("");

  const shownResult = manualResult ?? autoResult;
  const isAutoShown = !manualResult && !!autoResult;

  // ── Auto-assess on mount ──
  useEffect(() => {
    (async () => {
      try {
        const res = await predictPCOS();
        setAutoResult(res);
        setView("result");
      } catch (err) {
        setAutoError(
          err?.response?.data?.message ||
          "We need more health data before running this assessment."
        );
        setView("landing");
      }
    })();
  }, []);

  // ── Submit symptoms → save → predict ──
  const submitRefinement = async () => {
    setView("submitting");
    setError("");
    try {
      // Step 1: save user symptoms to profile (POST /period/pcos/symptoms)
      await savePcosSymptoms({
        weightGain:    symptoms.weight_gain,
        hairGrowth:    symptoms.hair_growth,
        skinDarkening: symptoms.skin_darkening,
        pimples:       symptoms.pimples,
      });
      // Step 2: run prediction — GET /period/pcos now uses the saved symptoms
      const res = await predictPCOS();
      setManualResult(res);
      setView("result");
    } catch (e) {
      setError(e?.response?.data?.message || "Could not submit. Please try again.");
      setView("refine");
    }
  };

  // ── Re-assess: clear results, go back to symptom form ──
  const retake = () => {
    setManualResult(null);
    setAutoResult(null);
    setSymptoms({ weight_gain: 0, hair_growth: 0, skin_darkening: 0, pimples: 0 });
    setView("refine");
  };

  return (
    <AppShell current="pcos">
      <div style={{
        padding: isMobile ? "16px 12px" : "32px 36px",
        maxWidth: 900, width: "100%",
        boxSizing: "border-box", overflowX: "hidden",
      }}>

        {/* Page header */}
        <div style={{ marginBottom: isMobile ? 18 : 28 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginBottom: 4 }}>AI Health Screening</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 26 : 34, fontWeight: 700, color: C.textDark, letterSpacing: "-0.5px" }}>
            PCOS Risk Assessment
          </h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, marginTop: 4 }}>
            ML-powered screening for awareness — not a medical diagnosis.
          </p>
        </div>

        {/* ── Loading ── */}
        {view === "loading" && <Spinner label="Running your auto-assessment…" />}

        {/* ── Submitting ── */}
        {view === "submitting" && <Spinner label="Analysing your responses…" />}

        {/* ── Landing ── */}
        {view === "landing" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            <Card>
              <div style={{ fontSize: 52, marginBottom: 18 }}>🧬</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, fontWeight: 700, color: C.textDark, marginBottom: 10 }}>What is PCOS?</h2>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.75, marginBottom: 20 }}>
                Polycystic Ovary Syndrome affects 1 in 10 women of reproductive age. Our ML model can give you an instant risk profile based on a few simple questions.
              </p>

              {autoError && (
                <DataRequiredBanner
                  message={autoError}
                  onGoToProfile={() => navigate("/profile")}
                  onGoToTracker={() => navigate("/tracker")}
                />
              )}

              <button onClick={() => setView("refine")} style={{
                width: "100%", background: C.grad, color: C.white, border: "none", borderRadius: 14,
                padding: "15px", fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700,
                cursor: "pointer", boxShadow: `0 6px 24px ${C.primaryGlow}`,
              }}>
                Begin Symptom Check 🧬
              </button>
            </Card>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>Common PCOS Signs</h3>
                {[
                  "Irregular or missed periods",
                  "Excess hair growth (hirsutism)",
                  "Acne or oily skin",
                  "Scalp hair thinning",
                  "Unexplained weight gain",
                  "Difficulty getting pregnant",
                  "Dark patches on skin folds",
                ].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.primary, marginTop: 2, fontSize: 14 }}>✦</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </Card>
              <div style={{ background: C.bgLight, borderRadius: 18, padding: "18px 20px", border: `1px solid ${C.border}`, boxSizing: "border-box" }}>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: C.primaryDark, marginBottom: 6 }}>⚕️ Medical Disclaimer</p>
                <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, lineHeight: 1.7 }}>
                  Results are for awareness only. Always consult a qualified healthcare provider for diagnosis and treatment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Result view ── */}
        {view === "result" && shownResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {isAutoShown && (
              <div style={{
                background: "linear-gradient(135deg, #F5F3FF, #EFF6FF)",
                border: "1.5px solid #C4B5FD",
                borderRadius: 16, padding: isMobile ? "12px 14px" : "14px 20px",
                marginBottom: 20,
                display: "flex", alignItems: "flex-start", gap: 12,
                boxSizing: "border-box",
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: "#5B21B6", marginBottom: 2 }}>
                    Auto-assessed from your cycle data
                  </p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#6D28D9" }}>
                    We used your period tracking data to run this assessment instantly. Add symptom details below for a more accurate result.
                  </p>
                </div>
              </div>
            )}
            <ResultPanel
              result={shownResult}
              isAuto={isAutoShown}
              showRefineBtn={isAutoShown}
              onRefine={() => setView("refine")}
              onRetake={retake}
            />
          </div>
        )}

        {/* ── Symptom refinement form ── */}
        {view === "refine" && (
          <div style={{ maxWidth: 660, width: "100%", boxSizing: "border-box" }}>
            {autoResult && (
              <div style={{
                background: C.bgLight, border: `1.5px solid ${C.border}`,
                borderRadius: 16, padding: isMobile ? "12px 14px" : "14px 20px",
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 12,
                boxSizing: "border-box",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>✏️</span>
                <div>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textDark, marginBottom: 1 }}>
                    Refining your result
                  </p>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft }}>
                    Adding symptom details improves accuracy. All fields are optional — just answer what applies to you.
                  </p>
                </div>
              </div>
            )}

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
                <span style={{ fontSize: 28 }}>🩺</span>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 26, fontWeight: 700, color: C.textDark, lineHeight: 1 }}>
                    Symptom Check
                  </h2>
                  <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginTop: 3 }}>
                    4 quick yes/no questions
                  </p>
                </div>
              </div>

              {error && (
                <div style={{ background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontFamily: "'Nunito', sans-serif", fontSize: 13, color: "#DC2626" }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                {SYMPTOMS.map(s => (
                  <SymptomToggle
                    key={s.key}
                    symptom={s}
                    value={symptoms[s.key]}
                    onChange={val => setSymptoms(prev => ({ ...prev, [s.key]: val }))}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setView(autoResult ? "result" : "landing")}
                  style={{ border: `2px solid ${C.border}`, borderRadius: 12, padding: "12px 18px", background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textSoft, cursor: "pointer", flexShrink: 0 }}
                >
                  ← Back
                </button>
                <button onClick={submitRefinement} style={{
                  flex: 1, background: C.grad, color: C.white, border: "none", borderRadius: 12,
                  padding: "13px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
                  cursor: "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}`,
                }}>
                  Get My Result →
                </button>
              </div>

              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft, textAlign: "center", marginTop: 14 }}>
                Answers default to "No" — only update what applies to you.
              </p>
            </Card>
          </div>
        )}

        {/* ── Community CTA ── */}
        {view === "result" && (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => navigate("/community")} style={{
              background: "none", border: `2px solid ${C.border}`, borderRadius: 12,
              padding: "11px 20px", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
              color: C.textMid, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "center" : "flex-start",
              boxSizing: "border-box",
            }}>
              💬 Talk to others with PCOS in the community →
            </button>
          </div>
        )}

      </div>
    </AppShell>
  );
}