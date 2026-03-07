import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { id: "dashboard",  path: "/dashboard",  icon: "⊞",  label: "Dashboard"       },
  { id: "tracker",    path: "/tracker",    icon: "◷",  label: "Cycle Tracker"   },
  { id: "pcos",       path: "/pcos",       icon: "◉",  label: "PCOS Assessment" },
  { id: "community",  path: "/community",  icon: "◎",  label: "Community"       },
  { id: "tips",       path: "/tips",       icon: "◆",  label: "Health Tips"     },
  { id: "profile",    path: "/profile",    icon: "◐",  label: "Profile"         },
];

// ─── Design tokens (matches CommunityPage / ProfilePage) ─────────────────────
const C = {
  primary:     "#D85E82",
  primaryDark: "#B8456A",
  secondary:   "#603377",
  bgLight:     "#F3E6EE",
  white:       "#FFFFFF",
  textDark:    "#2C1028",
  textMid:     "#5A3060",
  textSoft:    "#9B7AAA",
  border:      "#E8C8D8",
  sand:        "#FDF6FA",
  grad:        "linear-gradient(135deg, #D85E82, #603377)",
  sidebarBg:   "linear-gradient(180deg, #FDF0F6 0%, #FAF4FB 100%)",
};

export function Sidebar({ current }) {
  const navigate = useNavigate();
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 236,
      background: C.sidebarBg,
      borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column",
      padding: "0 12px 24px",
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 12px 28px", borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate("/dashboard")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <img
            src="image.png"
            alt="SheCare"
            style={{ width: 64, height: 64, objectFit: "contain" }}
            onError={e => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
          <div style={{
            display: "none", width: 56, height: 56,
            alignItems: "center", justifyContent: "center",
            fontSize: 28,
          }}>🌸</div>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
            fontWeight: 700, color: C.primaryDark, letterSpacing: "-0.3px",
          }}>SheCare</span>
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
              background: active ? C.grad : "transparent",
              color: active ? C.white : C.textSoft,
              fontFamily: "'Nunito', sans-serif", fontSize: 14,
              fontWeight: active ? 700 : 600,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: active ? `0 4px 16px rgba(216,94,130,0.30)` : "none",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bgLight; e.currentTarget.style.color = C.primaryDark; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSoft; } }}
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
      background: `linear-gradient(135deg, rgba(216,94,130,0.08), rgba(96,51,119,0.06))`,
      border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: C.grad,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 700, color: C.white,
        flexShrink: 0,
      }}>{initial}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft }}>SheCare Member</p>
      </div>
      <button onClick={() => navigate("/profile")} style={{
        marginLeft: "auto", background: "none", border: "none",
        cursor: "pointer", color: C.textSoft, fontSize: 16, flexShrink: 0,
      }}>⚙</button>
    </div>
  );
}

export function AppShell({ children, current }) {
  return (
    <div style={{ minHeight: "100vh", background: C.sand, display: "flex" }}>
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
          .main-content { margin-left: 0 !important; width: 100%; }
        }
        @media (min-width: 769px) {
          .mobile-bar { display: none !important; }
        }
        * { box-sizing: border-box; }
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
      background: C.white,
      borderBottom: `1px solid ${C.border}`,
      padding: "12px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      {/* Logo */}
      <button onClick={() => navigate("/dashboard")} style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <img
          src="image.png"
          alt="SheCare"
          style={{ width: 44, height: 44, objectFit: "contain" }}
          onError={e => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "inline";
          }}
        />
        <span style={{ display: "none", fontSize: 28 }}>🌸</span>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: 20,
          fontWeight: 700, color: C.primaryDark,
        }}>SheCare</span>
      </button>

      {/* Hamburger */}
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: "none", cursor: "pointer",
        color: C.textMid, fontSize: 22, lineHeight: 1,
        padding: "4px 6px", borderRadius: 8,
      }}>☰</button>

      {/* Dropdown menu */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 48, background: "rgba(44,16,40,0.2)" }}
          />
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            boxShadow: "0 8px 24px rgba(96,51,119,0.12)",
            zIndex: 49,
          }}>
            {NAV_LINKS.map(l => {
              const active = current === l.id;
              return (
                <button key={l.id} onClick={() => { navigate(l.path); setOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%",
                  padding: "13px 20px", background: active ? C.bgLight : "none",
                  border: "none", borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer", textAlign: "left",
                  color: active ? C.primaryDark : C.textSoft,
                  fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: active ? 700 : 600,
                }}>
                  <span style={{ fontSize: 16 }}>{l.icon}</span>
                  {l.label}
                  {active && (
                    <span style={{
                      marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                      background: C.primary, flexShrink: 0,
                    }} />
                  )}
                </button>
              );
            })}

            {/* User row at bottom of menu */}
            <MobileUserRow navigate={navigate} setOpen={setOpen} />
          </div>
        </>
      )}
    </div>
  );
}

function MobileUserRow({ navigate, setOpen }) {
  const raw  = localStorage.getItem("shecare_user");
  const user = raw ? JSON.parse(raw) : {};
  const name = user?.name || user?.username || "You";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 20px",
      background: `linear-gradient(135deg, rgba(216,94,130,0.06), rgba(96,51,119,0.04))`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: C.grad,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cormorant Garamond', serif", fontSize: 14, fontWeight: 700, color: C.white,
        flexShrink: 0,
      }}>{initial}</div>
      <div>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: C.textDark }}>{name}</p>
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: C.textSoft }}>SheCare Member</p>
      </div>
      <button onClick={() => { navigate("/profile"); setOpen(false); }} style={{
        marginLeft: "auto", background: "none", border: "none",
        cursor: "pointer", color: C.textSoft, fontSize: 16,
      }}>⚙</button>
    </div>
  );
}