import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/Layout";
import { getCalendar, getPrediction, getPhaseInsights, getAlerts } from "../api/periodService";
import { getHealthRisk } from "../api/healthService";

const C = {
  coral:"#FF6B47", coralDark:"#E5542F", peach:"#FFBE9F",
  peachLight:"#FFD9C4", peachPale:"#FFF0E8", sand:"#FFFAF6",
  textDark:"#2C1810", textMid:"#6B4535", textSoft:"#A07060"
};

const DAYS   = ["M","T","W","T","F","S","S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getOffset(y, m) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function fmt(dateStr) { if (!dateStr) return "—"; return new Date(dateStr).toLocaleDateString("en-IN", { day:"numeric", month:"short" }); }
function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24)); }
function parseDateToDay(dateStr) { if (!dateStr) return null; return new Date(dateStr).getDate(); }
function getDaysBetween(startStr, endStr) {
  if (!startStr || !endStr) return [];
  const days = []; const cur = new Date(startStr); const end = new Date(endStr);
  while (cur <= end) { days.push(cur.getDate()); cur.setDate(cur.getDate() + 1); }
  return days;
}

function LoadingCard({ height = 80 }) {
  return (
    <div style={{ height, borderRadius:16, background:`linear-gradient(90deg, ${C.peachPale} 0%, #fff 50%, ${C.peachPale} 100%)`, backgroundSize:"200% 100%", animation:"shimmer 1.4s infinite", border:`1px solid ${C.peachLight}` }} />
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [cm, setCm] = useState(today.getMonth());
  const [cy, setCy] = useState(today.getFullYear());
  const [calendar, setCalendar]           = useState(null);
  const [prediction, setPrediction]       = useState(null);
  const [phaseInsights, setPhaseInsights] = useState(null);
  const [alerts, setAlerts]               = useState([]);
  const [healthRisk, setHealthRisk]       = useState(null);
  const [loading, setLoading]             = useState(true);

  const raw  = localStorage.getItem("shecare_user");
  const user = raw ? JSON.parse(raw) : {};
  const displayName = user?.name || user?.username || "there";

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [calR, predR, insR, alertsR, riskR] = await Promise.allSettled([
        getCalendar(), getPrediction(), getPhaseInsights(), getAlerts(), getHealthRisk(),
      ]);

      // NOTE: service functions already return res.data, so .value IS the data directly
      if (calR.status    === "fulfilled") setCalendar(calR.value       ?? null);
      if (predR.status   === "fulfilled") setPrediction(predR.value    ?? null);
      if (insR.status    === "fulfilled") setPhaseInsights(insR.value  ?? null);
      if (alertsR.status === "fulfilled") setAlerts(alertsR.value      || []);
      if (riskR.status   === "fulfilled") setHealthRisk(riskR.value    ?? null);

      setLoading(false);
    };
    fetchAll();
  }, []);

  const inMonth = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getMonth() === cm && d.getFullYear() === cy;
  };

  const periodDays  = (calendar?.nextPeriodStart && calendar?.nextPeriodEnd && inMonth(calendar.nextPeriodStart))
    ? getDaysBetween(calendar.nextPeriodStart, calendar.nextPeriodEnd) : [];
  const fertileDays = (calendar?.fertileStart && calendar?.fertileEnd && inMonth(calendar.fertileStart))
    ? getDaysBetween(calendar.fertileStart, calendar.fertileEnd) : [];
  const pmsDays     = (calendar?.pmsStart && calendar?.pmsEnd && inMonth(calendar.pmsStart))
    ? getDaysBetween(calendar.pmsStart, calendar.pmsEnd) : [];
  const ovDay       = (calendar?.ovulationDay && inMonth(calendar.ovulationDay))
    ? parseDateToDay(calendar.ovulationDay) : null;

  const dayType = (d) => {
    if (periodDays.includes(d))  return "period";
    if (fertileDays.includes(d)) return "fertile";
    if (pmsDays.includes(d))     return "pms";
    if (d === ovDay)             return "ovulation";
    if (d === today.getDate() && cm === today.getMonth() && cy === today.getFullYear()) return "today";
    return "normal";
  };

  const dayStyle = (type) => {
    const base = { width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, cursor:"default", margin:"2px auto", fontFamily:"'Nunito', sans-serif", fontWeight:600, transition:"all 0.15s" };
    if (type === "period")    return { ...base, background:`linear-gradient(135deg, ${C.coral}, ${C.coralDark})`, color:"white", fontWeight:800 };
    if (type === "fertile")   return { ...base, background:"#E8F8EF", color:"#2D8A5A", fontWeight:700 };
    if (type === "ovulation") return { ...base, background:"#FEF3C7", color:"#D97706", fontWeight:800 };
    if (type === "pms")       return { ...base, background:"#F3E8FF", color:"#9333EA", fontWeight:700 };
    if (type === "today")     return { ...base, background:"none", color:C.coral, outline:`2px solid ${C.coral}`, outlineOffset:1, fontWeight:800 };
    return { ...base, color:C.textMid };
  };

  const nextPeriodStr = fmt(calendar?.nextPeriodStart);
  const daysToNext    = daysUntil(calendar?.nextPeriodStart);
  const currentPhase  = calendar?.currentPhase ?? "—";
  const cycleLength   = prediction?.predictedCycleLength ? `${Math.round(prediction.predictedCycleLength)} days` : "—";
  const nextPeriodSub = calendar?.nextPeriodStart ? `Next: ${fmt(calendar.nextPeriodStart)}` : "Log a period to predict";

  const riskScore = healthRisk?.score ?? healthRisk?.healthScore ?? null;
  const riskLabel = healthRisk?.riskLevel ?? healthRisk?.level ?? null;
  const riskDelta = healthRisk?.weeklyChange ?? null;

  const insightCards = (() => {
    if (!phaseInsights) return [];
    if (Array.isArray(phaseInsights)) return phaseInsights.slice(0, 3);
    return Object.entries(phaseInsights).slice(0, 3).map(([key, val]) => ({
      type:"tip", icon:"💡",
      title: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      body: Array.isArray(val) ? val.join(". ") : String(val),
    }));
  })();

  const displayInsights = insightCards.length > 0 ? insightCards : [
    { type:"tip",   icon:"🌿", title:`${currentPhase} Phase`, body:"Log your first period to get personalised AI insights for your cycle phase." },
    { type:"alert", icon:"📊", title:"Cycle Trend",           body:"Keep logging to let AI detect patterns in your cycle." },
  ];

  const insightBg = { tip:{ bg:"#FFF5EE", border:"#FFD9C4", c:C.coralDark }, alert:{ bg:"#FFFBEB", border:"#FDE68A", c:"#B45309" } };

  const pcosRisk  = healthRisk?.pcosRisk ?? healthRisk?.pcos_risk ?? null;
  const pcosLabel = pcosRisk === "high" ? "High Risk" : pcosRisk === "medium" ? "Medium Risk" : "Low Risk";
  const pcosPct   = pcosRisk === "high" ? 72 : pcosRisk === "medium" ? 44 : 22;
  const pcosColor = pcosRisk === "high"
    ? "linear-gradient(90deg,#EF4444,#F87171)"
    : pcosRisk === "medium" ? "linear-gradient(90deg,#F59E0B,#FCD34D)"
    : "linear-gradient(90deg,#22C55E,#4ADE80)";
  const pcosBadge = pcosRisk === "high"
    ? { bg:"#FEE2E2", c:"#DC2626", border:"#FECACA" }
    : pcosRisk === "medium" ? { bg:"#FEF3C7", c:"#D97706", border:"#FDE68A" }
    : { bg:"#F0FDF4", c:"#16A34A", border:"#BBF7D0" };

  const dim    = new Date(cy, cm + 1, 0).getDate();
  const offset = getOffset(cy, cm);

  const statCards = [
    { label:"Next Period",   val:nextPeriodStr,  sub: daysToNext != null ? `in ${daysToNext} days` : "No data yet",         icon:"🩸", g:`linear-gradient(135deg, #FF6B47, #E5542F)` },
    { label:"Current Phase", val:currentPhase,   sub:nextPeriodSub,                                                          icon:"🌘", g:`linear-gradient(135deg, #9333EA, #7C3AED)` },
    { label:"Cycle Length",  val:cycleLength,    sub:"AI predicted",                                                         icon:"📅", g:`linear-gradient(135deg, #F59E0B, #D97706)` },
    { label:"Health Score",  val:riskScore != null ? `${riskScore}/100` : "—", sub: riskDelta != null ? `${riskDelta > 0 ? "+" : ""}${riskDelta} this week` : riskLabel || "Log data to see", icon:"❤️", g:`linear-gradient(135deg, #22C55E, #16A34A)` },
  ];

  return (
    <AppShell current="dashboard">
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .db-root { padding: 24px 20px; max-width: 1100px; }

        /* Header */
        .db-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; gap:12px; }
        .db-header h1 { font-family:'Cormorant Garamond',serif; font-size:28px; font-weight:700; color:${C.textDark}; letter-spacing:-0.5px; margin:0; }
        .db-header p  { font-family:'Nunito',sans-serif; font-size:13px; color:${C.textSoft}; margin:0 0 4px; }
        .db-log-btn   { background:linear-gradient(135deg,${C.coral},${C.coralDark}); color:white; border:none; border-radius:12px; padding:11px 18px; font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 16px rgba(255,107,71,0.30); white-space:nowrap; flex-shrink:0; }

        /* Stat cards grid */
        .db-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }

        /* Main grid */
        .db-main  { display:grid; grid-template-columns:1.5fr 1fr; gap:20px; }

        /* Right column stack */
        .db-right { display:flex; flex-direction:column; gap:16px; }

        /* ─── Mobile ─── */
        @media (max-width: 767px) {
          .db-root  { padding: 16px 16px 80px; }
          .db-header h1 { font-size:22px; }
          .db-log-btn   { padding:10px 14px; font-size:13px; }
          .db-stats { grid-template-columns: repeat(2, 1fr); gap:10px; }
          .db-main  { grid-template-columns: 1fr; }
          .db-right { gap:12px; }
        }

        /* ─── Tablet ─── */
        @media (min-width:768px) and (max-width:1023px) {
          .db-root  { padding: 20px 24px; }
          .db-stats { grid-template-columns: repeat(2, 1fr); gap:12px; }
          .db-main  { grid-template-columns: 1fr; }
        }

        /* ─── Desktop ─── */
        @media (min-width:1024px) {
          .db-root  { padding:32px 36px; }
          .db-stats { grid-template-columns: repeat(4,1fr); }
          .db-main  { grid-template-columns: 1.5fr 1fr; }
        }
      `}</style>

      <div className="db-root">

        {/* Header */}
        <div className="db-header">
          <div>
            <p>Good morning ✨</p>
            <h1>Welcome back, {displayName}</h1>
          </div>
          <button className="db-log-btn" onClick={() => navigate("/tracker")}>+ Log Today</button>
        </div>

        {/* Alert banners */}
        {alerts.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {alerts.map((a, i) => {
              const col = { PERIOD:"#FEE2E2", OVULATION:"#FEF3C7", FERTILITY:"#D1FAE5" };
              const txt = { PERIOD:"#DC2626", OVULATION:"#D97706", FERTILITY:"#16A34A" };
              const ico = { PERIOD:"🩸", OVULATION:"🥚", FERTILITY:"🌱" };
              return (
                <div key={i} style={{ background:col[a.type]||C.peachPale, borderRadius:12, padding:"12px 16px", fontFamily:"'Nunito', sans-serif", fontSize:13, fontWeight:700, color:txt[a.type]||C.coralDark, border:`1px solid ${col[a.type]||C.peachLight}` }}>
                  {ico[a.type]||"🔔"} {a.message}
                </div>
              );
            })}
          </div>
        )}

        {/* New user nudge */}
        {!loading && !calendar && !prediction && (
          <div style={{ background:`linear-gradient(135deg, ${C.peachPale}, #fff)`, border:`1.5px solid ${C.peachLight}`, borderRadius:20, padding:"20px", marginBottom:20, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
            <span style={{ fontSize:36 }}>🌸</span>
            <div style={{ flex:1, minWidth:180 }}>
              <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:C.textDark, margin:"0 0 4px" }}>Start tracking your cycle</p>
              <p style={{ fontFamily:"'Nunito', sans-serif", fontSize:13, color:C.textSoft, margin:0 }}>Log your first period to unlock AI predictions, phase insights and your personal health dashboard.</p>
            </div>
            <button onClick={() => navigate("/tracker")} style={{ background:`linear-gradient(135deg, ${C.coral}, ${C.coralDark})`, color:"white", border:"none", borderRadius:12, padding:"11px 18px", fontFamily:"'Nunito', sans-serif", fontSize:14, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", boxShadow:"0 4px 16px rgba(255,107,71,0.30)" }}>
              Log First Period →
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="db-stats">
          {loading
            ? Array.from({ length:4 }).map((_, i) => (
                <div key={i} style={{ borderRadius:20, overflow:"hidden" }}><LoadingCard height={110} /></div>
              ))
            : statCards.map(c => (
                <div key={c.label} style={{ background:c.g, borderRadius:20, padding:"18px 16px", color:"white", boxShadow:"0 4px 20px rgba(0,0,0,0.10)" }}>
                  <div style={{ fontSize:22, marginBottom:8 }}>{c.icon}</div>
                  <p style={{ fontFamily:"'Nunito', sans-serif", fontSize:10, fontWeight:700, opacity:0.75, textTransform:"uppercase", letterSpacing:"0.8px", margin:"0 0 3px" }}>{c.label}</p>
                  <p style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:24, fontWeight:700, lineHeight:1, margin:0 }}>{c.val}</p>
                  <p style={{ fontFamily:"'Nunito', sans-serif", fontSize:11, opacity:0.7, margin:"4px 0 0" }}>{c.sub}</p>
                </div>
              ))
          }
        </div>

        {/* Main grid */}
        <div className="db-main">

          {/* Calendar */}
          <div style={{ background:"white", borderRadius:24, padding:"22px", border:`1px solid ${C.peachLight}`, boxShadow:"0 2px 16px rgba(255,107,71,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:C.textDark, margin:0 }}>{MONTHS[cm]} {cy}</h2>
              <div style={{ display:"flex", gap:4 }}>
                {["‹","›"].map((a, i) => (
                  <button key={a} onClick={() => {
                    if (i === 0) { if (cm === 0) { setCm(11); setCy(y => y-1); } else setCm(m => m-1); }
                    else         { if (cm === 11) { setCm(0); setCy(y => y+1); } else setCm(m => m+1); }
                  }} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.peachLight}`, background:"none", fontSize:16, cursor:"pointer", color:C.textSoft, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
              {DAYS.map((d, i) => <div key={i} style={{ textAlign:"center", fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:800, color:C.textSoft, padding:"4px 0" }}>{d}</div>)}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
              {Array.from({ length:offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length:dim }).map((_, i) => {
                const d = i + 1; const type = dayType(d);
                return <div key={d} style={{ textAlign:"center" }}><div style={dayStyle(type)}>{d}</div></div>;
              })}
            </div>

            {/* Legend */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"10px 16px", marginTop:16, paddingTop:14, borderTop:`1px solid ${C.peachLight}` }}>
              {[
                { label:"Period",    bg:`linear-gradient(135deg, ${C.coral}, ${C.coralDark})` },
                { label:"Fertile",   bg:"#E8F8EF", color:"#2D8A5A" },
                { label:"PMS",       bg:"#F3E8FF", color:"#9333EA" },
                { label:"Ovulation", bg:"#FEF3C7", color:"#D97706" },
              ].map(l => (
                <div key={l.label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:l.bg, flexShrink:0 }} />
                  <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:C.textSoft }}>{l.label}</span>
                </div>
              ))}
            </div>

            {!loading && !calendar && (
              <div style={{ marginTop:14, padding:"12px", background:C.peachPale, borderRadius:12, textAlign:"center" }}>
                <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:C.textSoft, margin:0 }}>
                  📅 Period markers will appear here once you log your first cycle.
                </p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="db-right">

            {/* PCOS risk */}
            <div style={{ background:"white", borderRadius:20, padding:"20px", border:`1px solid ${C.peachLight}`, boxShadow:"0 2px 12px rgba(255,107,71,0.05)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <h3 style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:700, color:C.textDark, margin:0 }}>🧬 PCOS Risk</h3>
                {!loading && (
                  <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, fontWeight:700, background:pcosBadge.bg, color:pcosBadge.c, padding:"3px 10px", borderRadius:20, border:`1px solid ${pcosBadge.border}` }}>
                    {pcosRisk ? pcosLabel : "Not assessed"}
                  </span>
                )}
              </div>
              {loading ? <LoadingCard height={24} /> : (
                <>
                  <div style={{ height:8, background:C.peachPale, borderRadius:4, marginBottom:8 }}>
                    <div style={{ width:`${pcosRisk ? pcosPct : 0}%`, height:"100%", background:pcosColor, borderRadius:4, transition:"width 0.8s ease" }} />
                  </div>
                  <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:C.textSoft, margin:0 }}>
                    {healthRisk?.lastChecked ? `Last checked: ${fmt(healthRisk.lastChecked)}. ` : ""}
                    <button onClick={() => navigate("/pcos")} style={{ background:"none", border:"none", cursor:"pointer", color:C.coral, fontWeight:700, fontSize:12, fontFamily:"'Nunito',sans-serif", padding:0 }}>
                      {pcosRisk ? "Re-assess →" : "Take assessment →"}
                    </button>
                  </p>
                </>
              )}
            </div>

            {/* Insights */}
            <div style={{ background:"white", borderRadius:20, padding:"20px", border:`1px solid ${C.peachLight}`, boxShadow:"0 2px 12px rgba(255,107,71,0.05)", flex:1 }}>
              <h3 style={{ fontFamily:"'Nunito',sans-serif", fontSize:14, fontWeight:700, color:C.textDark, margin:"0 0 14px" }}>💡 Today's Insights</h3>
              {loading
                ? <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[80,72,80].map((h,i) => <LoadingCard key={i} height={h} />)}</div>
                : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {displayInsights.map((ins, i) => {
                      const s = insightBg[ins.type] || insightBg.tip;
                      return (
                        <div key={i} style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"12px 14px" }}>
                          <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700, color:C.textDark, margin:"0 0 4px" }}>{ins.icon} {ins.title}</p>
                          <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:12, color:C.textSoft, lineHeight:1.6, margin:0 }}>{ins.body}</p>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>
          </div>
        </div>

        {/* Cycle Summary */}
        {!loading && prediction && (
          <div style={{ background:"white", borderRadius:24, padding:"22px", border:`1px solid ${C.peachLight}`, boxShadow:"0 2px 16px rgba(255,107,71,0.06)", marginTop:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:C.textDark, margin:0 }}>Cycle Summary</h2>
              <button onClick={() => navigate("/tracker")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:13, fontWeight:700, color:C.coral, padding:0 }}>View tracker →</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
              {[
                { label:"Predicted Start", val:fmt(prediction.predictedStartDate) },
                { label:"Predicted End",   val:fmt(prediction.predictedEndDate) },
                { label:"Ovulation Day",   val:fmt(prediction.ovulationDay) },
                { label:"Cycle Length",    val:prediction.predictedCycleLength ? `${Math.round(prediction.predictedCycleLength)}d` : "—" },
              ].map(({ label, val }) => (
                <div key={label} style={{ background:C.peachPale, borderRadius:14, padding:"14px", border:`1px solid ${C.peachLight}`, textAlign:"center" }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:700, color:C.coral, margin:0 }}>{val}</p>
                  <p style={{ fontFamily:"'Nunito',sans-serif", fontSize:11, color:C.textSoft, margin:"4px 0 0" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}