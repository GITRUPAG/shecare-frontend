import { useState } from "react";
import { AppShell } from "../components/Layout";

const C = { coral:"#FF6B47", coralDark:"#E5542F", peach:"#FFBE9F", peachLight:"#FFD9C4", peachPale:"#FFF0E8", sand:"#FFFAF6", textDark:"#2C1810", textMid:"#6B4535", textSoft:"#A07060" };

const CATS = ["All","Nutrition","Fitness","PCOS","Mental Wellness","Period Health","Hormonal Health"];

const CAT_ACCENT = {
  "PCOS":            { bg:"#F5F3FF", border:"#DDD6FE", tag:"#7C3AED", bar:"#8B5CF6" },
  "Nutrition":       { bg:"#F0FDF4", border:"#BBF7D0", tag:"#16A34A", bar:"#22C55E" },
  "Fitness":         { bg:"#FFFBEB", border:"#FCD34D", tag:"#D97706", bar:"#F59E0B" },
  "Period Health":   { bg:C.peachPale, border:C.peachLight, tag:C.coralDark, bar:C.coral },
  "Mental Wellness": { bg:"#EFF6FF", border:"#BFDBFE", tag:"#2563EB", bar:"#3B82F6" },
  "Hormonal Health": { bg:"#FFF0F0", border:"#FECACA", tag:"#DC2626", bar:"#EF4444" },
};

const ARTICLES = [
  { id:1, cat:"PCOS", icon:"🧬", time:"6 min", featured:true,
    title:"PCOS-Friendly Diet: What to Eat and Avoid",
    excerpt:"Managing PCOS through nutrition can significantly reduce symptoms. Learn the best foods to balance insulin, reduce inflammation, and support hormone health.",
    content:["Focus on low-glycaemic foods that prevent insulin spikes","Anti-inflammatory foods: berries, leafy greens, fatty fish","Avoid refined sugars, white bread, processed snacks","High-fibre foods: legumes, vegetables, whole grains","Spearmint tea shown to reduce androgen levels","Consider inositol supplements after consulting your doctor"] },
  { id:2, cat:"Nutrition", icon:"🥗", time:"4 min", featured:true,
    title:"Eating for Your Cycle: Phase-by-Phase Nutrition Guide",
    excerpt:"Your nutritional needs shift throughout your cycle. Here's exactly what to eat each phase for optimal energy and reduced symptoms.",
    content:["Menstrual: Iron (spinach, lentils), Vitamin C (citrus), Omega-3 (salmon)","Follicular: Protein (eggs, chicken), Fermented foods (yogurt, kimchi)","Ovulation: Zinc (pumpkin seeds), Raw vegetables, Light proteins","Luteal: Magnesium (bananas, dark chocolate), Complex carbs, less caffeine"] },
  { id:3, cat:"Fitness", icon:"💪", time:"5 min", featured:false,
    title:"Cycle-Synced Workouts: Exercise for Every Phase",
    excerpt:"Stop forcing the same workout every day. Match your exercise intensity to your cycle phase for better results and less burnout.",
    content:["Menstrual: Gentle yoga, stretching, slow walks — rest is productive","Follicular: Moderate cardio, strength training, try new activities","Ovulation: High-intensity, HIIT, running, PR attempts","Luteal: Pilates, barre, lighter weights, longer rest periods"] },
  { id:4, cat:"Period Health", icon:"🩸", time:"7 min", featured:false,
    title:"Managing PMS: Evidence-Based Strategies That Actually Work",
    excerpt:"PMS affects up to 75% of women. Beyond painkillers, there are lifestyle and nutritional strategies backed by strong evidence.",
    content:["Reduce salt 2 weeks before to minimize bloating","Magnesium supplement 400mg daily reduces cramp severity","Evening primrose oil for breast tenderness","Vitamin B6 for mood regulation","Regular aerobic exercise reduces PMS symptoms by ~40%","Limit alcohol and caffeine in the luteal phase"] },
  { id:5, cat:"Mental Wellness", icon:"🧠", time:"5 min", featured:false,
    title:"Cycle-Aware Mental Health: Why You Feel Different Every Week",
    excerpt:"Understanding how hormones affect your brain can transform your relationship with your emotions and mental health.",
    content:["Estrogen boosts serotonin — you feel best during follicular phase","Progesterone has calming but sedating effects in luteal phase","Tracking mood helps distinguish hormonal from situational emotions","PMDD is a real clinical condition — see a doctor if symptoms are severe","Mindfulness during luteal phase significantly reduces emotional reactivity"] },
  { id:6, cat:"Hormonal Health", icon:"⚗️", time:"8 min", featured:false,
    title:"Understanding Your Hormones: A Complete Plain-Language Guide",
    excerpt:"Estrogen, progesterone, FSH, LH, testosterone — what do they actually do? Here's everything in plain language.",
    content:["Estrogen: builds uterine lining, boosts mood, energy & libido","Progesterone: calming effect, prepares for pregnancy, rises after ovulation","FSH: triggers follicle development in early cycle","LH: triggers ovulation mid-cycle","Testosterone: peaks at ovulation, drives confidence and libido","Cortisol: stress hormone that disrupts all of the above — manage it first"] },
];

// Responsive hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useState(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  });
  return isMobile;
}

function ArticleCard({ a, onOpen, isMobile }) {
  const acc = CAT_ACCENT[a.cat] || CAT_ACCENT["Period Health"];
  // On mobile, featured cards don't span 2 cols (single col layout)
  const gridCol = (!isMobile && a.featured) ? "span 2" : "span 1";
  return (
    <div
      onClick={() => onOpen(a)}
      style={{
        background: "white",
        borderRadius: 22,
        overflow: "hidden",
        border: `1px solid ${C.peachLight}`,
        cursor: "pointer",
        transition: "all 0.25s",
        gridColumn: gridCol,
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={e => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,107,71,0.13)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ height: 5, background: acc.bar }} />
      <div style={{ padding: isMobile ? "18px 20px" : "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: acc.bg, color: acc.tag, border: `1px solid ${acc.border}` }}>{a.cat}</span>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: C.textSoft }}>{a.time} read</span>
        </div>
        <div style={{ fontSize: isMobile ? 30 : 36, marginBottom: 12 }}>{a.icon}</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: a.featured && !isMobile ? 24 : 19, fontWeight: 700, color: C.textDark, marginBottom: 8, lineHeight: 1.3 }}>{a.title}</h3>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, lineHeight: 1.75, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.excerpt}</p>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, color: C.coral, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700 }}>
          Read article <span>→</span>
        </div>
      </div>
    </div>
  );
}

function ArticleModal({ a, onClose, isMobile }) {
  if (!a) return null;
  const acc = CAT_ACCENT[a.cat] || CAT_ACCENT["Period Health"];
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(44,24,16,0.35)",
        backdropFilter: "blur(6px)",
        zIndex: 200,
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        padding: isMobile ? 0 : 20,
        overflowY: "auto",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "white",
        borderRadius: isMobile ? "28px 28px 0 0" : 28,
        width: "100%",
        maxWidth: isMobile ? "100%" : 600,
        boxShadow: "0 24px 80px rgba(44,24,16,0.18)",
        overflow: "hidden",
        // On mobile: sheet slides up from bottom; cap height
        maxHeight: isMobile ? "92vh" : "90vh",
        overflowY: "auto",
      }}>
        {/* Drag handle for mobile */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, paddingBottom: 4 }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: C.peachLight }} />
          </div>
        )}
        <div style={{ height: 6, background: acc.bar }} />
        <div style={{ padding: isMobile ? "24px 22px 36px" : "36px 40px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: acc.bg, color: acc.tag }}>{a.cat} · {a.time} read</span>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, color: C.textDark, marginTop: 10, lineHeight: 1.2 }}>{a.title}</h2>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSoft, fontSize: 20, flexShrink: 0, marginTop: 4, padding: "4px 8px", minWidth: 44, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, lineHeight: 1.8, marginBottom: 20 }}>{a.excerpt}</p>
          <div style={{ background: C.peachPale, borderRadius: 18, padding: isMobile ? "18px 18px" : "22px 24px", border: `1px solid ${C.peachLight}` }}>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, color: C.coralDark, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Key Takeaways</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {a.content.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: C.coral, fontSize: 14, marginTop: 2, flexShrink: 0 }}>✦</span>
                  <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button style={{ flex: 1, background: `linear-gradient(135deg, ${C.coral}, ${C.coralDark})`, color: "white", border: "none", borderRadius: 12, padding: "14px", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 48 }}>🔖 Save Article</button>
            <button style={{ flex: 1, border: `2px solid ${C.peachLight}`, borderRadius: 12, padding: "14px", background: "white", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: C.textSoft, cursor: "pointer", minHeight: 48 }}>↗ Share</button>
          </div>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft, textAlign: "center", marginTop: 14 }}>⚕️ For informational purposes. Always consult a healthcare provider.</p>
        </div>
      </div>
    </div>
  );
}

export default function HealthTipsPage({ onNav }) {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);
  const isMobile = useIsMobile();

  const visible = ARTICLES.filter(a =>
    (cat === "All" || a.cat === cat) &&
    (search === "" || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase()))
  );

  // Grid: 1 col on mobile, 2 on tablet (sm), 3 on desktop
  const gridCols = isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))";

  return (
    <AppShell current="tips" onNav={onNav}>
      <div style={{ padding: isMobile ? "24px 16px" : "32px 36px", maxWidth: 1100 }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, color: C.textSoft, marginBottom: 4 }}>Evidence-Based Guides</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, fontWeight: 700, color: C.textDark, letterSpacing: "-0.5px" }}>Women's Health Tips</h1>
          <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, marginTop: 4 }}>Curated, evidence-based articles to help you understand and care for your body.</p>
        </div>

        {/* Search + filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              style={{ width: "100%", border: `2px solid ${C.peachLight}`, borderRadius: 14, padding: "12px 14px 12px 38px", fontFamily: "'Nunito', sans-serif", fontSize: 14, outline: "none", color: C.textDark, background: "white", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = C.coral}
              onBlur={e => e.target.style.borderColor = C.peachLight}
            />
          </div>

          {/* Category pills — horizontally scrollable on mobile */}
          <div style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            // Hide scrollbar visually but keep it functional
            msOverflowStyle: "none",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}>
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  flexShrink: 0,
                  padding: "9px 18px",
                  borderRadius: 50,
                  border: `2px solid ${cat === c ? C.coral : C.peachLight}`,
                  background: cat === c ? `linear-gradient(135deg, ${C.coral}, ${C.coralDark})` : "white",
                  color: cat === c ? "white" : C.textSoft,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: cat === c ? "0 4px 14px rgba(255,107,71,0.28)" : "none",
                  minHeight: 40,
                  WebkitTapHighlightColor: "transparent",
                }}
              >{c}</button>
            ))}
          </div>
        </div>

        {/* Daily tip banner */}
        <div style={{
          background: `linear-gradient(135deg, ${C.coral}, ${C.coralDark})`,
          borderRadius: 22,
          padding: isMobile ? "18px 20px" : "20px 28px",
          marginBottom: 24,
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 14,
          color: "white",
        }}>
          <span style={{ fontSize: isMobile ? 26 : 32, flexShrink: 0, marginTop: isMobile ? 2 : 0 }}>💡</span>
          <div>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 800, opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Daily Tip · Luteal Phase</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: isMobile ? 14 : 15, fontWeight: 600, lineHeight: 1.5 }}>Magnesium significantly reduces PMS cramps. Try dark chocolate, almonds, or a supplement today.</p>
          </div>
        </div>

        {/* Articles grid */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: isMobile ? 16 : 20 }}>
          {visible.map(a => <ArticleCard key={a.id} a={a} onOpen={setOpen} isMobile={isMobile} />)}
        </div>

        {visible.length === 0 && (
          <div style={{ background: "white", borderRadius: 22, padding: isMobile ? "60px 24px" : "80px 40px", textAlign: "center", border: `1px solid ${C.peachLight}` }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🌸</span>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: C.textDark }}>No articles found</p>
            <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, color: C.textSoft, marginTop: 6 }}>Try a different search or category</p>
          </div>
        )}

        <ArticleModal a={open} onClose={() => setOpen(null)} isMobile={isMobile} />
      </div>
    </AppShell>
  );
}