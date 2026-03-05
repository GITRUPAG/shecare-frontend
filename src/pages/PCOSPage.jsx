import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/Layout";
import { predictPCOS, getLatestPrediction, getPeriodPrediction } from "../api/periodService";

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

// ─── Symptom questions (yes/no) — the 4 fields user must confirm ──────────────
const SYMPTOMS = [
  { key: "weight_gain",    icon: "⚖️", label: "Unexplained weight gain",            hint: "Gained weight without a clear dietary change" },
  { key: "hair_growth",    icon: "🌿", label: "Excess facial / body hair",           hint: "Hair on face, chest or back beyond what's normal for you" },
  { key: "skin_darkening", icon: "🩺", label: "Dark skin patches",                  hint: "Darkening on neck, armpits or groin (acanthosis nigricans)" },
  { key: "pimples",        icon: "✨", label: "Persistent acne or oily skin",        hint: "Hormonal acne, especially along the chin and jaw" },
];

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: C.white, borderRadius: 22,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 16px rgba(96,51,119,0.07)",
      padding: "28px 32px",
      ...style,
    }}>
      {children}
    </div>
  );
}

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
      borderRadius: 16, padding: "16px 20px",
      transition: "all 0.2s", cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textDark, marginBottom: 3 }}>
            <span style={{ marginRight: 8 }}>{symptom.icon}</span>{symptom.label}
          </p>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>{symptom.hint}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          {[{ val: 0, label: "No" }, { val: 1, label: "Yes" }].map(opt => (
            <button key={opt.val} onClick={() => onChange(opt.val)} style={{
              padding: "7px 18px", borderRadius: 10, border: "none",
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
  const risk = resolveRisk(result);
  const prob = result?.pcos_probability ?? null;
  const factors = result?.top_risk_factors ?? [];
  const rec     = result?.recommendation ?? "";
  const interp  = result?.interpretation ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Hero */}
      <div style={{
        background: risk.bg,
        border: `2px solid ${risk.border}`,
        borderRadius: 24, padding: "32px 36px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 58, lineHeight: 1 }}>{risk.emoji}</span>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.textSoft, textTransform: "uppercase", letterSpacing: "1.2px" }}>
                PCOS Risk Assessment
              </p>
              {isAuto && (
                <Pill color={C.secondary} bg="#F5F3FF">⚡ Auto-assessed</Pill>
              )}
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 700, color: risk.text, lineHeight: 1, marginBottom: 10 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Recommendation */}
        {rec && (
          <Card>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>📋 Recommendation</h3>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textMid, lineHeight: 1.8 }}>{rec}</p>
          </Card>
        )}

        {/* Risk factors */}
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

      {/* Disclaimer */}
      {result?.disclaimer && (
        <div style={{ background: "#F8F8FA", borderRadius: 14, padding: "14px 18px", border: "1px solid #E8E8EF" }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#888", lineHeight: 1.7 }}>
            ⚕️ {result.disclaimer}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {showRefineBtn && (
          <button onClick={onRefine} style={{
            background: C.grad, color: C.white, border: "none", borderRadius: 12,
            padding: "13px 24px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
            cursor: "pointer", boxShadow: `0 4px 16px ${C.primaryGlow}`,
          }}>
            ✏️ Refine with Symptoms →
          </button>
        )}
        <button onClick={onRetake} style={{
          border: `2px solid ${C.border}`, borderRadius: 12, padding: "13px 24px",
          background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textSoft, cursor: "pointer",
        }}>
          🔄 Re-assess
        </button>
      </div>
    </div>
  );
}

// ─── PCOSPage ─────────────────────────────────────────────────────────────────
export default function PCOSPage() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("shecare_user") || "{}");

  // Page states: "loading" | "landing" | "refine" | "submitting" | "result"
  const [view,           setView]           = useState("loading");
  const [autoResult,     setAutoResult]     = useState(null);   // result from auto-assess
  const [manualResult,   setManualResult]   = useState(null);   // result after symptom refine
  const [cycleData,      setCycleData]      = useState(null);   // from /api/period/prediction
  const [autoPayload,    setAutoPayload]    = useState(null);   // payload used for auto-assess
  const [symptoms,       setSymptoms]       = useState({ weight_gain: 0, hair_growth: 0, skin_darkening: 0, pimples: 0 });
  const [error,          setError]          = useState("");
  const [autoError,      setAutoError]      = useState("");     // non-fatal auto-assess error

  // The result currently shown (manual takes priority over auto)
  const shownResult = manualResult ?? autoResult;
  const isAutoShown = !manualResult && !!autoResult;

  // ── On mount: fetch cycle data → auto-assess ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // 1. Fetch latest period prediction for cycle context
        const pred = await getPeriodPrediction();
        setCycleData(pred);

        // 2. Build payload with defaults where medical data is unknown
        //    Fields we CAN derive from cycle prediction:
        //      cycle_length   → predictedCycleLength
        //      cycle_regularity → 1 (regular) if prediction exists, else 0
        //    Fields we use safe defaults for:
        //      age, bmi, follicle counts, hormone levels (0 = unknown / not provided)
        const payload = buildAutoPayload(pred, currentUser);
        setAutoPayload(payload);

        // 3. Run prediction
        const res = await predictPCOS(payload);
        setAutoResult(res);
        setView("result");
      } catch (e) {
        // If no cycle data or prediction fails — go to landing so user can refine manually
        setAutoError("We couldn't auto-assess (no cycle data yet). You can manually enter symptoms below.");
        setView("landing");
      }
    })();
  }, []);

  function buildAutoPayload(pred, user) {
    // Use profile BMI if stored, otherwise 22 (healthy default)
    const bmi = parseFloat(user?.bmi ?? 22);
    const age  = parseFloat(user?.age ?? 25);

    return {
      age,
      bmi,
      cycle_length:      pred?.predictedCycleLength ?? 28,
      cycle_regularity:  pred ? 1 : 0,
      follicle_no_right: 5,
      follicle_no_left:  5,
      amh:               3.0,
      fsh:               5.0,
      lh:                7.0,
      fsh_lh_ratio:      (5.0 / 7.0),   // ~0.71
      waist_hip_ratio:   0.8,
      endometrium_mm:    7,
      avg_follicle_size_r: 12,
      avg_follicle_size_l: 12,
      // Symptom defaults — user hasn't answered yet
      weight_gain:    0,
      hair_growth:    0,
      skin_darkening: 0,
      pimples:        0,
    };
  }

  // ── Refine: re-run with symptom answers ─────────────────────────────────────
  const submitRefinement = async () => {
    setView("submitting");
    setError("");
    try {
      const payload = { ...(autoPayload ?? buildAutoPayload(cycleData, currentUser)), ...symptoms };
      const res = await predictPCOS(payload);
      setManualResult(res);
      setView("result");
    } catch (e) {
      setError("Could not submit. Please try again.");
      setView("refine");
    }
  };

  // ── Reset everything ─────────────────────────────────────────────────────────
  const retake = () => {
    setManualResult(null);
    setAutoResult(null);
    setSymptoms({ weight_gain: 0, hair_growth: 0, skin_darkening: 0, pimples: 0 });
    setView("refine");   // go straight to symptom form on manual retake
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AppShell current="pcos">
      <div style={{ padding: "32px 36px", maxWidth: 900 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginBottom: 4 }}>AI Health Screening</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 700, color: C.textDark, letterSpacing: "-0.5px" }}>
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

        {/* ── Landing (no cycle data, manual path) ── */}
        {view === "landing" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <Card>
              <div style={{ fontSize: 52, marginBottom: 18 }}>🧬</div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.textDark, marginBottom: 10 }}>What is PCOS?</h2>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.75, marginBottom: 20 }}>
                Polycystic Ovary Syndrome affects 1 in 10 women of reproductive age. Our ML model can give you an instant risk profile based on a few simple questions.
              </p>
              {autoError && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: "10px 14px", marginBottom: 18, fontFamily: "'Nunito', sans-serif", fontSize: 12, color: "#92400E" }}>
                  ⚠️ {autoError}
                </div>
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
              <Card style={{ padding: "24px 28px" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: C.textDark, marginBottom: 14 }}>Common PCOS Signs</h3>
                {["Irregular or missed periods", "Excess hair growth (hirsutism)", "Acne or oily skin", "Scalp hair thinning", "Unexplained weight gain", "Difficulty getting pregnant", "Dark patches on skin folds"].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: C.primary, marginTop: 2, fontSize: 14 }}>✦</span>
                    <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textMid, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </Card>
              <div style={{ background: C.bgLight, borderRadius: 18, padding: "18px 22px", border: `1px solid ${C.border}` }}>
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
            {/* Auto-assess info banner */}
            {isAutoShown && (
              <div style={{
                background: "linear-gradient(135deg, #F5F3FF, #EFF6FF)",
                border: `1.5px solid #C4B5FD`,
                borderRadius: 16, padding: "14px 20px",
                marginBottom: 20,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{ fontSize: 22 }}>⚡</span>
                <div style={{ flex: 1 }}>
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
          <div style={{ maxWidth: 660 }}>

            {/* Context banner if auto result already exists */}
            {autoResult && (
              <div style={{
                background: C.bgLight, border: `1.5px solid ${C.border}`,
                borderRadius: 16, padding: "14px 20px", marginBottom: 24,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 20 }}>✏️</span>
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
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: C.textDark, lineHeight: 1 }}>
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

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
                {SYMPTOMS.map(s => (
                  <SymptomToggle
                    key={s.key}
                    symptom={s}
                    value={symptoms[s.key]}
                    onChange={val => setSymptoms(prev => ({ ...prev, [s.key]: val }))}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setView(autoResult ? "result" : "landing")}
                  style={{ border: `2px solid ${C.border}`, borderRadius: 12, padding: "12px 22px", background: C.white, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textSoft, cursor: "pointer" }}
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

        {/* ── Always-visible community CTA at bottom ── */}
        {(view === "result") && (
          <div style={{ marginTop: 20 }}>
            <button onClick={() => navigate("/community")} style={{
              background: "none", border: `2px solid ${C.border}`, borderRadius: 12,
              padding: "11px 20px", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700,
              color: C.textMid, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              💬 Talk to others with PCOS in the community →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}