import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { id: "dashboard",  path: "/dashboard",  icon: "◈",  label: "Dashboard"       },
  { id: "tracker",    path: "/tracker",    icon: "◷",  label: "Cycle Tracker"   },
  { id: "pcos",       path: "/pcos",       icon: "◉",  label: "PCOS Assessment" },
  { id: "community",  path: "/community",  icon: "◎",  label: "Community"       },
  { id: "tips",       path: "/tips",       icon: "◆",  label: "Health Tips"     },
  { id: "profile",    path: "/profile",    icon: "◐",  label: "Profile"         },
];

export function Sidebar({ current }) {
  const navigate = useNavigate();
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 236,
      background: "linear-gradient(180deg, #FFF0E8 0%, #FFFAF6 100%)",
      borderRight: "1px solid #FFD9C4",
      display: "flex", flexDirection: "column",
      padding: "0 12px 24px",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 12px 32px", borderBottom: "1px solid #FFD9C4" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #FF6B47, #FFBE9F)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 4px 12px rgba(255,107,71,0.35)",
          }}>🌸</div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#C4633A", letterSpacing: "-0.3px" }}>SheCare</span>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 20, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_LINKS.map(l => {
          const active = current === l.id;
          return (
            <button key={l.id} onClick={() => navigate(l.path)} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", borderRadius: 12, border: "none",
              background: active ? "linear-gradient(135deg, #FF6B47, #FF8F72)" : "transparent",
              color: active ? "white" : "#A07060",
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: active ? 700 : 600,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: active ? "0 4px 16px rgba(255,107,71,0.30)" : "none",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#FFE8DC"; e.currentTarget.style.color = "#C4633A"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#A07060"; } }}
            >
              <span style={{ fontSize: 16, opacity: active ? 1 : 0.7 }}>{l.icon}</span>
              {l.label}
            </button>
          );
        })}
      </nav>

      {/* User card */}
      <UserCard navigate={navigate} />
    </aside>
  );
}

function UserCard({ navigate }) {
  const raw  = localStorage.getItem("shecare_user");
  const user = raw ? JSON.parse(raw) : {};
  const name = user?.name || user?.username || "You";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div style={{
      background: "linear-gradient(135deg, #FFBE9F30, #FF6B4710)",
      border: "1px solid #FFD9C4", borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "linear-gradient(135deg, #FF8F72, #FFBE9F)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: "white",
      }}>{initial}</div>
      <div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: "#2C1810" }}>{name}</p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: "#A07060" }}>Day 18 · Luteal</p>
      </div>
      <button onClick={() => navigate("/profile")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#C9A898", fontSize: 16 }}>⚙</button>
    </div>
  );
}

export function AppShell({ children, current }) {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFAF6", display: "flex" }}>
      {/* Desktop sidebar */}
      <div className="hide-mobile">
        <Sidebar current={current} />
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 236, flex: 1, minHeight: "100vh" }} className="main-content page-enter">
        {/* Mobile top bar */}
        <MobileTopBar current={current} />
        {children}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .main-content { margin-left: 0 !important; }
        }
        @media (min-width: 769px) {
          .mobile-bar { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function MobileTopBar({ current }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-bar" style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "#FFFAF6", borderBottom: "1px solid #FFD9C4",
      padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🌸</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#C4633A" }}>SheCare</span>
      </button>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A07060", fontSize: 20 }}>☰</button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#FFFAF6", borderBottom: "1px solid #FFD9C4",
          padding: "12px 20px",
        }}>
          {NAV_LINKS.map(l => (
            <button key={l.id} onClick={() => { navigate(l.path); setOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 8px", background: "none", border: "none", cursor: "pointer",
              color: current === l.id ? "#FF6B47" : "#A07060",
              fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600,
              borderBottom: "1px solid #FFE8DC",
            }}>
              <span>{l.icon}</span>{l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}