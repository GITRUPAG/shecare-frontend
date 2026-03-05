import { useState, useEffect, useMemo } from "react";
import { AppShell } from "../components/Layout";
import {
  logPeriod,
  getPrediction,
  getPhaseInsights,
  getAlerts,
  getCalendar,
  getPeriodLogs,
} from "../api/periodService";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     "#D85E82",
  primaryDark: "#B8456A",
  primaryGlow: "rgba(216,94,130,0.15)",
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
  fertile:     "#16A34A",
  ovulation:   "#D97706",
  luteal:      "#603377",
  follicular:  "#2563EB",
};

const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MONTHS     = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MOODS      = [{ v:1,e:"😢",l:"Sad" },{ v:2,e:"😔",l:"Low" },{ v:3,e:"😐",l:"Okay" },{ v:4,e:"🙂",l:"Good" },{ v:5,e:"😄",l:"Great" }];
const FLOWS      = [{ v:0,l:"None",icon:"○" },{ v:1,l:"Spotting",icon:"·" },{ v:2,l:"Light",icon:"◔" },{ v:3,l:"Moderate",icon:"◑" },{ v:4,l:"Heavy",icon:"●" }];
const SYMPTOMS   = ["Cramps","Bloating","Headache","Fatigue","Breast Tenderness","Back Pain","Nausea","Acne","Mood Swings","Food Cravings","Insomnia","Hot Flashes"];

const fmt      = d => !d ? "—" : new Date(d + "T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});
const fmtRange = (a,b) => (!a||!b) ? "—" : `${fmt(a)} – ${fmt(b)}`;
const toISO    = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

// ─── Build a Set of all ISO dates that fall within any past period range ──────
function buildPastPeriodDates(logs) {
  const set = new Set();
  if (!logs?.length) return set;
  for (const log of logs) {
    if (!log.startDate) continue;
    const start = new Date(log.startDate + "T00:00:00");
    const end   = new Date((log.endDate || log.startDate) + "T00:00:00");
    const cur   = new Date(start);
    while (cur <= end) {
      set.add(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

// ─── Phase banner data ────────────────────────────────────────────────────────
const PHASE_META = {
  Menstrual:   { color: C.primary,     bg: "#FFF0F6", border: "#F9C8DC", icon: "🩸", tip: "Rest, stay warm and hydrated. Iron-rich foods help replenish energy." },
  Follicular:  { color: C.follicular,  bg: "#EFF6FF", border: "#BFDBFE", icon: "🌱", tip: "Energy is rising. Great time for new habits, workouts and social plans." },
  Fertile:     { color: C.fertile,     bg: "#F0FDF4", border: "#BBF7D0", icon: "🌸", tip: "Peak fertility window. Estrogen is high — you may feel your best." },
  Ovulation:   { color: C.ovulation,   bg: "#FFFBEB", border: "#FDE68A", icon: "✨", tip: "Ovulation day. High energy and confidence — lean into it." },
  Luteal:      { color: C.luteal,      bg: "#FAF5FF", border: "#DDD6FE", icon: "🌙", tip: "Progesterone rises. Wind down, prioritise sleep and magnesium-rich foods." },
};

// ─── Period Calendar ──────────────────────────────────────────────────────────
function PeriodCalendar({ startDate, endDate, onStartDate, onEndDate, pastPeriodDates, prediction, showHistory }) {
  const today = new Date();
  const [vy, setVy] = useState(today.getFullYear());
  const [vm, setVm] = useState(today.getMonth());

  const todayISO       = toISO(today.getFullYear(), today.getMonth(), today.getDate());
  const daysInMonth    = new Date(vy, vm+1, 0).getDate();
  const firstDayOfWeek = new Date(vy, vm, 1).getDay();

  const handleClick = iso => {
    if (iso > todayISO) return;
    if (iso === startDate && !endDate) { onStartDate(""); return; }
    if (iso === endDate)               { onEndDate("");   return; }
    if (!startDate) {
      onStartDate(iso);
    } else if (!endDate) {
      if (iso < startDate) { onStartDate(iso); }
      else if (iso === startDate) { onStartDate(""); }
      else { onEndDate(iso); }
    } else {
      onStartDate(iso); onEndDate("");
    }
  };

  const prevMonth = () => { if (vm===0){setVy(y=>y-1);setVm(11);}else setVm(m=>m-1); };
  const nextMonth = () => { if (vm===11){setVy(y=>y+1);setVm(0);}else setVm(m=>m+1); };

  const newSelState = iso => {
    if (iso===startDate && iso===endDate) return "selSingle";
    if (iso===startDate) return "selStart";
    if (iso===endDate)   return "selEnd";
    if (startDate && endDate && iso>startDate && iso<endDate) return "selRange";
    return null;
  };

  const isPast = iso => showHistory && pastPeriodDates.has(iso);

  const predState = iso => {
    if (!prediction) return null;
    if (iso === prediction.ovulationDay)                                              return "ovulation";
    if (iso >= prediction.fertileStart && iso <= prediction.fertileEnd)               return "fertile";
    if (iso >= prediction.predictedStartDate && iso <= prediction.predictedEndDate)   return "nextPeriod";
    return null;
  };

  const cells = [];
  for (let i=0;i<firstDayOfWeek;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={prevMonth} style={navBtnStyle}
          onMouseEnter={e=>{e.currentTarget.style.background=C.bgLight;e.currentTarget.style.borderColor=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor=C.border;}}>‹</button>
        <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:20,fontWeight:700,color:C.textDark}}>{MONTHS[vm]} {vy}</span>
        <button onClick={nextMonth} style={navBtnStyle}
          onMouseEnter={e=>{e.currentTarget.style.background=C.bgLight;e.currentTarget.style.borderColor=C.primary;}}
          onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.borderColor=C.border;}}>›</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {DAYS_SHORT.map(d=>(
          <div key={d} style={{textAlign:"center",fontFamily:"'Nunito', sans-serif",fontSize:11,fontWeight:800,color:C.textSoft,padding:"4px 0",letterSpacing:"0.5px"}}>{d}</div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px 0"}}>
        {cells.map((day,idx) => {
          if (!day) return <div key={`e${idx}`}/>;
          const iso    = toISO(vy, vm, day);
          const future = iso > todayISO;
          const selSt  = newSelState(iso);
          const pastP  = isPast(iso);
          const pred   = predState(iso);
          const isToday = iso === todayISO;

          const isSelRange  = selSt === "selRange";
          const isSelEdge   = selSt === "selStart" || selSt === "selEnd" || selSt === "selSingle";

          const cellFill =
            isSelRange                          ? C.primaryGlow :
            pastP && !isSelEdge                 ? "rgba(216,94,130,0.12)" :
            pred === "ovulation" && !isSelEdge  ? "rgba(217,119,6,0.13)" :
            pred === "fertile"   && !isSelEdge  ? "rgba(22,163,74,0.12)" :
            "transparent";

          let btnBg = "transparent";
          if (isSelEdge)                   btnBg = C.primary;
          else if (pred === "ovulation")   btnBg = "rgba(217,119,6,0.22)";
          else if (pred === "fertile")     btnBg = "rgba(22,163,74,0.20)";
          else if (pastP)                  btnBg = "rgba(216,94,130,0.18)";

          let btnColor = future ? C.textSoft+"55" : C.textDark;
          if (isSelEdge)                             btnColor = "#fff";
          else if (isToday && !pastP && !isSelEdge)  btnColor = C.primary;
          else if (pred === "ovulation")             btnColor = "#92400E";
          else if (pred === "fertile")               btnColor = "#14532D";
          else if (pastP)                            btnColor = C.primaryDark;

          let btnBorder = "2px solid transparent";
          if (isToday && !isSelEdge) btnBorder = `2px solid ${C.primary}`;

          return (
            <div key={iso} style={{
              background: cellFill,
              borderRadius: selSt==="selStart"?"50% 0 0 50%": selSt==="selEnd"?"0 50% 50% 0": isSelRange?"0":"0",
              display:"flex", alignItems:"center", justifyContent:"center",
              height:38,
            }}>
              <button onClick={()=>handleClick(iso)} style={{
                width:36, height:36,
                borderRadius:"50%",
                border: btnBorder,
                background: btnBg,
                color: btnColor,
                fontFamily:"'Nunito', sans-serif",
                fontSize:13,
                fontWeight: isSelEdge||isToday||pastP||pred ? 700 : 500,
                cursor: future ? "default" : "pointer",
                transition:"all 0.12s",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow: isSelEdge ? `0 3px 12px ${C.primaryGlow}` : "none",
              }}
                onMouseEnter={e=>{ if(!isSelEdge&&!future){ e.currentTarget.style.outline=`2px solid ${C.border}`; } }}
                onMouseLeave={e=>{ e.currentTarget.style.outline="none"; }}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`,flexWrap:"wrap"}}>
        <LegendDot color={C.primary}                  label="Start / End"  circle />
        {showHistory && <LegendDot color="rgba(216,94,130,0.18)"  label="Past period" />}
        <LegendDot color="transparent"                label="Today"        border={`2px solid ${C.primary}`} circle />
        {prediction && <>
          <LegendDot color="rgba(22,163,74,0.20)"   label="Fertile"    />
          <LegendDot color="rgba(217,119,6,0.22)"   label="Ovulation"  />
        </>}
        <span style={{marginLeft:"auto",fontFamily:"'Nunito', sans-serif",fontSize:11,color:C.textSoft,fontStyle:"italic"}}>Double-tap to remove</span>
      </div>
    </div>
  );
}

const navBtnStyle = {width:32,height:32,borderRadius:"50%",border:`1.5px solid ${C.border}`,background:"none",cursor:"pointer",color:C.textMid,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,transition:"all 0.15s"};

function LegendDot({ color, label, border, circle }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:5}}>
      <div style={{width:12,height:12,borderRadius:circle?"50%":"3px",background:color,border:border||"none",flexShrink:0}}/>
      <span style={{fontFamily:"'Nunito', sans-serif",fontSize:11,color:C.textSoft}}>{label}</span>
    </div>
  );
}

// ─── Past Periods List ────────────────────────────────────────────────────────
function PastPeriodsList({ logs }) {
  const deduped = useMemo(() => {
    if (!logs?.length) return [];
    const seen = new Map();
    for (const log of logs) {
      const key = log.startDate;
      if (!seen.has(key)) {
        seen.set(key, log);
      } else {
        const prev = seen.get(key);
        const prevDur = prev.duration || 0;
        const curDur  = log.duration  || 0;
        if (curDur > prevDur) seen.set(key, log);
      }
    }
    return Array.from(seen.values());
  }, [logs]);

  if (!deduped.length) return (
    <div style={{textAlign:"center",padding:"32px 0"}}>
      <div style={{fontSize:36,marginBottom:10}}>📅</div>
      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,color:C.textSoft,fontStyle:"italic"}}>No past period logs yet. Start logging to see your history here.</p>
    </div>
  );
  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      {deduped.map((log,i)=>(
        <div key={log.id||i} style={{display:"flex",alignItems:"center",gap:16,padding:"14px 0",borderBottom:i<deduped.length-1?`1px solid ${C.bgLight}`:"none"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:C.primary,flexShrink:0}}/>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontFamily:"'Cormorant Garamond', serif",fontSize:18,fontWeight:700,color:C.textDark}}>
              {fmt(log.startDate)}{log.endDate&&log.endDate!==log.startDate?` – ${fmt(log.endDate)}`:""} 
            </span>
            {log.duration && (
              <span style={{fontFamily:"'Nunito', sans-serif",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20,background:C.bgLight,color:C.primaryDark}}>
                {log.duration}d
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────
function Slider({ label, value, onChange, min=1, max=10, left, right }) {
  const pct = ((value-min)/(max-min))*100;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <label style={{fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:700,color:C.textMid}}>{label}</label>
        <span style={{fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:800,color:C.primary}}>{value}{max===12?"h":"/"+max}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(+e.target.value)}
        style={{width:"100%",accentColor:C.primary,background:`linear-gradient(to right,${C.primary} ${pct}%,${C.bgLight} ${pct}%)`}}/>
      {(left||right)&&(
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontFamily:"'Nunito', sans-serif",fontSize:11,color:C.textSoft}}>{left}</span>
          <span style={{fontFamily:"'Nunito', sans-serif",fontSize:11,color:C.textSoft}}>{right}</span>
        </div>
      )}
    </div>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────
function Banner({ type, message, onClose }) {
  if (!message) return null;
  const s = {
    error:   {bg:"#FFF0F4",border:"#F4B8CB",icon:"⚠️",color:C.primaryDark},
    success: {bg:"#F0FDF4",border:"#A8E6C3",icon:"✅",color:"#1E7E4A"},
    info:    {bg:C.bgLight,border:C.border,icon:"💡",color:C.secondary},
  }[type]||{};
  return (
    <div style={{background:s.bg,border:`1.5px solid ${s.border}`,borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <span>{s.icon}</span>
      <span style={{fontFamily:"'Nunito', sans-serif",fontSize:13,color:s.color,fontWeight:600,flex:1}}>{message}</span>
      {onClose&&<button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:s.color,fontSize:16}}>✕</button>}
    </div>
  );
}

// ─── Phase Banner ─────────────────────────────────────────────────────────────
function PhaseBanner({ phase }) {
  const meta = PHASE_META[phase];
  if (!meta) return null;
  return (
    <div style={{background:meta.bg,border:`1.5px solid ${meta.border}`,borderRadius:16,padding:"16px 20px",display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
      <span style={{fontSize:26,lineHeight:1,flexShrink:0}}>{meta.icon}</span>
      <div>
        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,fontWeight:800,color:meta.color,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>
          {phase} Phase
        </p>
        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,color:C.textMid,lineHeight:1.65}}>{meta.tip}</p>
      </div>
      <span style={{marginLeft:"auto",fontFamily:"'Nunito', sans-serif",fontSize:11,fontWeight:800,padding:"4px 12px",borderRadius:20,background:meta.color+"18",color:meta.color,border:`1px solid ${meta.color}30`,flexShrink:0,alignSelf:"flex-start"}}>
        Today
      </span>
    </div>
  );
}

// ─── New User Empty State ─────────────────────────────────────────────────────
function NewUserWelcome({ onStartLogging }) {
  return (
    <div style={{
      background: C.white, borderRadius: 24, border: `1px solid ${C.border}`,
      boxShadow: "0 2px 16px rgba(96,51,119,0.07)",
      padding: "48px 40px", textAlign: "center", maxWidth: 480, margin: "0 auto",
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🌸</div>
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.textDark, marginBottom: 10 }}>
        Welcome to Your Cycle Tracker
      </h2>
      <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.7, marginBottom: 28 }}>
        Log your first period to unlock AI predictions, phase insights, fertile window tracking and your personal cycle history.
      </p>
      <button onClick={onStartLogging} style={{
        background: C.grad, color: "#fff", border: "none", borderRadius: 14,
        padding: "14px 32px", fontFamily: "'Nunito', sans-serif", fontSize: 15,
        fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${C.primaryGlow}`,
      }}>
        Log My First Period →
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CycleTrackerPage() {
  

  const [tab,         setTab]         = useState("log");
  const [log,         setLog]         = useState({mood:3,flow:0,pain:2,sleep:7,stress:3,energy:6,symptoms:[],notes:"",startDate:"",endDate:""});
  const [submitting,  setSubmitting]  = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [feedback,    setFeedback]    = useState({type:"",msg:""});
  const [showHistory, setShowHistory] = useState(true);

  // API state
  const [prediction,  setPrediction]  = useState(null);
  const [calendar,    setCalendar]    = useState(null);
  const [alerts,      setAlerts]      = useState([]);
  const [insights,    setInsights]    = useState(null);
  const [periodLogs,  setPeriodLogs]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  // ── FIX: use Promise.allSettled so 403s for new users don't crash the page ──
  useEffect(()=>{
    Promise.allSettled([
      getPrediction(), getCalendar(), getAlerts(), getPhaseInsights(), getPeriodLogs()
    ]).then(([pred,cal,alrt,ins,logs])=>{
      if(pred.status==="fulfilled")  setPrediction(pred.value ?? null);
      if(cal.status==="fulfilled")   setCalendar(cal.value ?? null);
      if(alrt.status==="fulfilled")  setAlerts(alrt.value || []);
      if(ins.status==="fulfilled")   setInsights(ins.value ?? null);
      if(logs.status==="fulfilled")  setPeriodLogs(logs.value || []);
      // rejected = 403 / no data yet — state stays null, handled gracefully below
    }).finally(()=>setLoading(false));
  },[]);

  const todayISO = useMemo(()=>{
    const t = new Date();
    return toISO(t.getFullYear(), t.getMonth(), t.getDate());
  },[]);

  const pastPeriodDates = useMemo(()=>buildPastPeriodDates(periodLogs),[periodLogs]);
  const isTodayPeriod   = pastPeriodDates.has(todayISO);
  const currentPhase    = isTodayPeriod ? "Menstrual" : (calendar?.currentPhase ?? null);
  const phaseColor      = {Menstrual:C.primary,Follicular:C.follicular,Fertile:C.fertile,Ovulation:C.ovulation,Luteal:C.luteal};
  const phaseC          = phaseColor[currentPhase] || C.textMid;

  const upd      = (k,v) => setLog(l=>({...l,[k]:v}));
  const toggleSx = s => upd("symptoms", log.symptoms.includes(s)?log.symptoms.filter(x=>x!==s):[...log.symptoms,s]);

  const save = async () => {
    if (!log.startDate) { setFeedback({type:"error",msg:"Please select your period start date on the calendar."}); return; }
    setSubmitting(true); setFeedback({type:"",msg:""});
    try {
      await logPeriod({
        startDate:log.startDate, endDate:log.endDate||log.startDate,
        mood:log.mood, flowLevel:log.flow, painLevel:log.pain,
        sleepHours:log.sleep, stressLevel:log.stress, energyLevel:log.energy,
        symptoms:log.symptoms, notes:log.notes,
      });
      setSaved(true);
      setFeedback({type:"success",msg:"Log saved! AI predictions updated. 🌸"});
      // Refresh — again use allSettled so a partial failure doesn't throw
      const [pred,cal,alrt,logs] = await Promise.allSettled([
        getPrediction(), getCalendar(), getAlerts(), getPeriodLogs()
      ]);
      if(pred.status==="fulfilled") setPrediction(pred.value ?? null);
      if(cal.status==="fulfilled")  setCalendar(cal.value ?? null);
      if(alrt.status==="fulfilled") setAlerts(alrt.value || []);
      if(logs.status==="fulfilled") setPeriodLogs(logs.value || []);
      setTimeout(()=>{ setSaved(false); setFeedback({type:"",msg:""}); },3500);
    } catch(e) {
      setFeedback({type:"error",msg:e?.response?.data?.message||"Failed to save log."});
    } finally { setSubmitting(false); }
  };

  const card = {background:C.white,borderRadius:24,padding:"28px",border:`1px solid ${C.border}`,boxShadow:"0 2px 16px rgba(96,51,119,0.07)"};

  // ── Determine if this is a brand new user (no data anywhere) ────────────────
  const isNewUser = !loading && !prediction && !calendar && periodLogs.length === 0;

  return (
    <AppShell current="tracker">
      <div style={{padding:"32px 36px",maxWidth:1060}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,color:C.textSoft,marginBottom:4}}>
              {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}
            </p>
            <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:36,fontWeight:700,color:C.textDark,letterSpacing:"-0.5px",lineHeight:1}}>Cycle Tracker</h1>
          </div>
          {currentPhase && (
            <span style={{fontFamily:"'Nunito', sans-serif",fontSize:12,fontWeight:800,padding:"6px 16px",borderRadius:20,background:`${phaseC}18`,color:phaseC,border:`1.5px solid ${phaseC}40`}}>
              {PHASE_META[currentPhase]?.icon} {currentPhase} Phase
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <p style={{fontFamily:"'Nunito', sans-serif",fontSize:14,color:C.textSoft}}>Loading your cycle data…</p>
          </div>
        )}

        {/* ── New user welcome state — shown instead of all tabs ── */}
        {!loading && isNewUser && tab !== "log" && (
          <NewUserWelcome onStartLogging={() => setTab("log")} />
        )}

        {/* Only render tabs + content once loading is done */}
        {!loading && (
          <>
            {/* Phase banner */}
            {currentPhase && <PhaseBanner phase={currentPhase}/>}

            {/* Health alerts */}
            {alerts.map((a,i)=>(
              <Banner key={i} type="info" message={`${a.type==="PERIOD"?"🩸":a.type==="OVULATION"?"🌿":"🌱"} ${a.message}`}/>
            ))}

            {/* Tabs */}
            <div style={{display:"flex",gap:4,background:C.bgLight,borderRadius:14,padding:4,marginBottom:28,width:"fit-content"}}>
              {[["log","📝 Log Today"],["history","📅 Cycle History"],["predictions","🔮 Predictions"]].map(([t,l])=>(
                <button key={t} onClick={()=>setTab(t)} style={{
                  padding:"10px 22px",borderRadius:10,border:"none",
                  background:tab===t?C.white:"transparent",
                  color:tab===t?C.textDark:C.textSoft,
                  fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:700,
                  cursor:"pointer",transition:"all 0.2s",
                  boxShadow:tab===t?"0 2px 10px rgba(96,51,119,0.12)":"none",
                }}>{l}</button>
              ))}
            </div>

            {/* ══════ LOG TAB ══════ */}
            {tab==="log" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:20,alignItems:"start"}}>
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <Banner type={feedback.type} message={feedback.msg} onClose={()=>setFeedback({type:"",msg:""})}/>

                  {/* Calendar card */}
                  <div style={card}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                      <div>
                        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:4}}>🩸 Select Period Dates</h2>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textSoft}}>Tap once for start · tap again for end · double-tap to remove</p>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        <button onClick={()=>setShowHistory(h=>!h)} style={{
                          fontFamily:"'Nunito', sans-serif",fontSize:11,fontWeight:700,
                          padding:"5px 12px",borderRadius:8,cursor:"pointer",transition:"all 0.2s",
                          background:showHistory?C.bgLight:"transparent",
                          color:showHistory?C.primaryDark:C.textSoft,
                          border:`1.5px solid ${showHistory?C.primary:C.border}`,
                        }}>
                          {showHistory?"📅 History On":"📅 History Off"}
                        </button>
                        {(log.startDate||log.endDate)&&(
                          <button onClick={()=>{upd("startDate","");upd("endDate","");}} style={{fontFamily:"'Nunito', sans-serif",fontSize:11,fontWeight:700,color:C.textSoft,background:"none",border:`1.5px solid ${C.border}`,borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>
                            Clear ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <PeriodCalendar
                      startDate={log.startDate}   endDate={log.endDate}
                      onStartDate={v=>upd("startDate",v)} onEndDate={v=>upd("endDate",v)}
                      pastPeriodDates={pastPeriodDates}
                      prediction={prediction}
                      showHistory={showHistory}
                    />

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:16}}>
                      <div style={{background:log.startDate?C.bgLight:"#F9F9F9",borderRadius:12,padding:"12px 16px",border:`1.5px solid ${log.startDate?C.primary:C.border}`,transition:"all 0.2s"}}>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:10,fontWeight:800,color:C.textSoft,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Period Start</p>
                        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:20,fontWeight:700,color:log.startDate?C.primary:C.textSoft}}>
                          {log.startDate?fmt(log.startDate):"Not selected"}
                        </p>
                      </div>
                      <div style={{background:log.endDate?C.bgLight:"#F9F9F9",borderRadius:12,padding:"12px 16px",border:`1.5px solid ${log.endDate?C.primary:C.border}`,transition:"all 0.2s"}}>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:10,fontWeight:800,color:C.textSoft,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Period End</p>
                        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:20,fontWeight:700,color:log.endDate?C.primary:C.textSoft}}>
                          {log.endDate?fmt(log.endDate):"Tap another date"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mood */}
                  <div style={card}>
                    <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:18}}>How are you feeling?</h2>
                    <div style={{display:"flex",gap:8}}>
                      {MOODS.map(m=>(
                        <button key={m.v} onClick={()=>upd("mood",m.v)} style={{
                          flex:1,padding:"16px 6px",borderRadius:16,
                          border:`2px solid ${log.mood===m.v?C.primary:C.border}`,
                          background:log.mood===m.v?C.bgLight:C.white,
                          cursor:"pointer",transition:"all 0.2s",
                          display:"flex",flexDirection:"column",alignItems:"center",gap:8,
                          boxShadow:log.mood===m.v?`0 4px 14px ${C.primaryGlow}`:"none",
                        }}>
                          <span style={{fontSize:26}}>{m.e}</span>
                          <span style={{fontFamily:"'Nunito', sans-serif",fontSize:11,fontWeight:700,color:log.mood===m.v?C.primary:C.textSoft}}>{m.l}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Flow */}
                  <div style={card}>
                    <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:16}}>Flow Intensity</h2>
                    <div style={{display:"flex",gap:8}}>
                      {FLOWS.map(f=>{
                        const sel=log.flow===f.v;
                        return (
                          <button key={f.v} onClick={()=>upd("flow",f.v)} style={{
                            flex:1,padding:"14px 6px",borderRadius:14,
                            border:`2px solid ${sel?C.primary:C.border}`,
                            background:sel?C.grad:C.white,
                            color:sel?"#fff":C.textSoft,
                            fontFamily:"'Nunito', sans-serif",fontSize:12,fontWeight:700,
                            cursor:"pointer",transition:"all 0.2s",
                            display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                            boxShadow:sel?`0 4px 14px ${C.primaryGlow}`:"none",
                          }}>
                            <span style={{fontSize:18}}>{f.icon}</span>
                            <span>{f.l}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sliders */}
                  <div style={{...card,display:"flex",flexDirection:"column",gap:26}}>
                    <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark}}>Today's Metrics</h2>
                    <Slider label="Pain Level"   value={log.pain}   onChange={v=>upd("pain",v)}   left="None"      right="Severe"/>
                    <Slider label="Sleep"        value={log.sleep}  onChange={v=>upd("sleep",v)}  min={3} max={12} left="3h"       right="12h"/>
                    <Slider label="Stress Level" value={log.stress} onChange={v=>upd("stress",v)} left="Calm"      right="Stressed"/>
                    <Slider label="Energy Level" value={log.energy} onChange={v=>upd("energy",v)} left="Exhausted" right="Energized"/>
                  </div>

                  {/* Symptoms */}
                  <div style={card}>
                    <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:16}}>Symptoms</h2>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                      {SYMPTOMS.map(s=>{
                        const sel=log.symptoms.includes(s);
                        return (
                          <button key={s} onClick={()=>toggleSx(s)} style={{
                            padding:"8px 16px",borderRadius:50,
                            border:`2px solid ${sel?C.primary:C.border}`,
                            background:sel?C.grad:C.white,
                            color:sel?"#fff":C.textSoft,
                            fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:600,
                            cursor:"pointer",transition:"all 0.2s",
                            boxShadow:sel?`0 2px 10px ${C.primaryGlow}`:"none",
                          }}>{s}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={card}>
                    <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:12}}>Notes</h2>
                    <textarea value={log.notes} onChange={e=>upd("notes",e.target.value)}
                      placeholder="Anything else to remember about today..."
                      rows={3} style={{width:"100%",border:`2px solid ${C.border}`,borderRadius:12,padding:"14px",fontFamily:"'Nunito', sans-serif",fontSize:14,color:C.textDark,resize:"none",outline:"none",transition:"border-color 0.2s",boxSizing:"border-box",background:C.sand}}
                      onFocus={e=>e.target.style.borderColor=C.primary}
                      onBlur={e=>e.target.style.borderColor=C.border}/>
                  </div>
                </div>

                {/* ── Sidebar ── */}
                <div style={{display:"flex",flexDirection:"column",gap:14,position:"sticky",top:24}}>

                  {/* Summary card */}
                  <div style={{...card,padding:"22px"}}>
                    <h3 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:20,fontWeight:700,color:C.textDark,marginBottom:14}}>Today's Summary</h3>
                    <div style={{background:log.startDate?C.bgLight:"#F9F9F9",borderRadius:12,padding:"12px 14px",marginBottom:12,border:`1px solid ${log.startDate?C.primary+"40":C.border}`}}>
                      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:10,fontWeight:800,color:C.textSoft,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:4}}>Period Dates</p>
                      {log.startDate
                        ? <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:700,color:C.textDark}}>{fmt(log.startDate)}{log.endDate?` → ${fmt(log.endDate)}`:" (ongoing)"}</p>
                        : <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textSoft,fontStyle:"italic"}}>Select on calendar ↑</p>
                      }
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
                      {[
                        ["Mood",   MOODS.find(m=>m.v===log.mood)?.e+" "+MOODS.find(m=>m.v===log.mood)?.l],
                        ["Flow",   FLOWS.find(f=>f.v===log.flow)?.l],
                        ["Pain",   `${log.pain}/10`],
                        ["Sleep",  `${log.sleep}h`],
                        ["Energy", `${log.energy}/10`],
                      ].map(([k,v])=>(
                        <div key={k} style={{display:"flex",justifyContent:"space-between",paddingBottom:7,borderBottom:`1px solid ${C.bgLight}`}}>
                          <span style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textSoft}}>{k}</span>
                          <span style={{fontFamily:"'Nunito', sans-serif",fontSize:12,fontWeight:700,color:C.textDark}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {log.symptoms.length>0&&(
                      <div style={{marginBottom:14}}>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:10,color:C.textSoft,marginBottom:6,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px"}}>Symptoms</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {log.symptoms.map(s=><span key={s} style={{fontFamily:"'Nunito', sans-serif",fontSize:11,background:C.bgLight,color:C.primaryDark,borderRadius:20,padding:"3px 10px",fontWeight:600}}>{s}</span>)}
                        </div>
                      </div>
                    )}
                    <button onClick={save} disabled={submitting} style={{
                      width:"100%",border:"none",borderRadius:12,padding:"14px",
                      background:saved?"linear-gradient(135deg,#22C55E,#16A34A)":submitting?C.border:C.grad,
                      color:"#fff",fontFamily:"'Nunito', sans-serif",fontSize:14,fontWeight:700,
                      cursor:submitting?"not-allowed":"pointer",transition:"all 0.3s",
                      boxShadow:saved?"0 4px 16px rgba(34,197,94,0.35)":`0 4px 20px ${C.primaryGlow}`,
                    }}>
                      {submitting?"Saving…":saved?"✓ Saved!":"Save Log →"}
                    </button>
                  </div>

                  {/* AI prediction */}
                  <div style={{background:C.grad,borderRadius:20,padding:"20px",color:"#fff"}}>
                    <p style={{fontFamily:"'Nunito', sans-serif",fontSize:10,fontWeight:800,opacity:0.75,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>🔮 AI Prediction</p>
                    {prediction ? (
                      <>
                        <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:24,fontWeight:700,marginBottom:2}}>{fmt(prediction.predictedStartDate)}</p>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:11,opacity:0.8,marginBottom:8}}>Next period start</p>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,opacity:0.85}}>Fertile: {fmtRange(prediction.fertileStart,prediction.fertileEnd)}</p>
                        {prediction.ovulationDay&&<p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,opacity:0.85,marginTop:4}}>Ovulation: {fmt(prediction.ovulationDay)}</p>}
                      </>
                    ) : (
                      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,opacity:0.75,lineHeight:1.6}}>Log a period to get your first AI prediction.</p>
                    )}
                  </div>

                  {/* Phase insight */}
                  {insights&&(
                    <div style={{...card,padding:"18px"}}>
                      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:10,fontWeight:800,color:C.secondary,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>💡 Phase Insight</p>
                      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textMid,lineHeight:1.65}}>
                        {typeof insights==="string"?insights:insights?.tip||insights?.message||"—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════ HISTORY TAB ══════ */}
            {tab==="history" && (
              periodLogs.length === 0 ? (
                <NewUserWelcome onStartLogging={() => setTab("log")} />
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start"}}>
                  <div style={card}>
                    <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:4}}>Period Calendar</h2>
                    <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textSoft,marginBottom:20}}>Your logged period history visualised on the calendar</p>
                    <PeriodCalendar
                      startDate={null} endDate={null}
                      onStartDate={()=>{}} onEndDate={()=>{}}
                      pastPeriodDates={pastPeriodDates}
                      prediction={prediction}
                      showHistory={true}
                    />
                  </div>
                  <div style={card}>
                    <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:20}}>
                      <div>
                        <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.textDark,marginBottom:4}}>Past Periods</h2>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textSoft}}>
                          {[...new Map(periodLogs.map(l=>[l.startDate,l])).values()].length} cycle{[...new Map(periodLogs.map(l=>[l.startDate,l])).values()].length!==1?"s":""} logged
                        </p>
                      </div>
                    </div>
                    <PastPeriodsList logs={periodLogs}/>
                  </div>
                </div>
              )
            )}

            {/* ══════ PREDICTIONS TAB ══════ */}
            {tab==="predictions" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                <div style={card}>
                  <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:24,fontWeight:700,color:C.textDark,marginBottom:24}}>🔮 Upcoming Predictions</h2>
                  {!prediction ? (
                    <div style={{background:C.bgLight,borderRadius:14,padding:"24px",textAlign:"center"}}>
                      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,color:C.textSoft,marginBottom:14}}>No predictions yet. Log a period to generate your first AI prediction.</p>
                      <button onClick={()=>setTab("log")} style={{background:C.grad,color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>→ Log Today</button>
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column"}}>
                      {[
                        {l:"Next Period",    d:fmtRange(prediction.predictedStartDate,prediction.predictedEndDate), c:C.primary},
                        {l:"Fertile Window", d:fmtRange(prediction.fertileStart,prediction.fertileEnd),             c:C.fertile},
                        {l:"Ovulation Day",  d:fmt(prediction.ovulationDay),                                       c:C.ovulation},
                        // ── FIX: safe-access calendar fields — null when new user ──
                        {l:"PMS Window",     d:calendar ? fmtRange(calendar.pmsStart, calendar.pmsEnd) : "—",      c:C.luteal},
                      ].map(p=>(
                        <div key={p.l} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 0",borderBottom:`1px solid ${C.bgLight}`}}>
                          <div>
                            <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,fontWeight:700,color:C.textSoft,marginBottom:4}}>{p.l}</p>
                            <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:p.c}}>{p.d}</p>
                          </div>
                          <span style={{fontFamily:"'Nunito', sans-serif",fontSize:10,fontWeight:800,padding:"3px 10px",borderRadius:20,background:`${p.c}18`,color:p.c,border:`1px solid ${p.c}30`}}>AI</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={card}>
                  <h2 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:24,fontWeight:700,color:C.textDark,marginBottom:20}}>📈 Cycle Analysis</h2>
                  {/* ── FIX: guard calendar before reading .nextPeriodStart / .ovulationDay ── */}
                  {calendar ? (
                    <div style={{display:"flex",flexDirection:"column",gap:12}}>
                      <div style={{background:"#F0FDF4",borderRadius:14,padding:"16px",border:"1px solid #BBF7D0"}}>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:700,color:"#16A34A"}}>
                          ✓ Current Phase: {currentPhase || calendar.currentPhase}
                        </p>
                        <p style={{fontFamily:"'Nunito', sans-serif",fontSize:12,color:C.textSoft,marginTop:4,lineHeight:1.6}}>
                          {/* ── FIX: safe-access both fields — were crashing for new users ── */}
                          Next period starts {fmt(calendar.nextPeriodStart ?? null)}.{" "}
                          {calendar.ovulationDay ? `Ovulation on ${fmt(calendar.ovulationDay)}.` : ""}
                        </p>
                      </div>
                      {prediction&&(
                        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                          {[
                            ["Cycle Length",`${Math.round(prediction.predictedCycleLength||29)}d`],
                            ["Period End",fmt(prediction.predictedEndDate)],
                            ["Fertile Start",fmt(prediction.fertileStart)],
                            ["Ovulation",fmt(prediction.ovulationDay)],
                          ].map(([l,v])=>(
                            <div key={l} style={{background:C.bgLight,borderRadius:14,padding:"14px",textAlign:"center",border:`1px solid ${C.border}`}}>
                              <p style={{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:700,color:C.primary}}>{v}</p>
                              <p style={{fontFamily:"'Nunito', sans-serif",fontSize:11,color:C.textSoft,marginTop:2}}>{l}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // ── FIX: was crashing here when calendar was null for new users ──
                    <div style={{background:C.bgLight,borderRadius:14,padding:"24px",textAlign:"center"}}>
                      <p style={{fontFamily:"'Nunito', sans-serif",fontSize:13,color:C.textSoft,marginBottom:14}}>
                        Cycle analysis will appear here after you log your first period.
                      </p>
                      <button onClick={()=>setTab("log")} style={{background:C.grad,color:"#fff",border:"none",borderRadius:10,padding:"10px 20px",fontFamily:"'Nunito', sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>→ Log Today</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </AppShell>
  );
}