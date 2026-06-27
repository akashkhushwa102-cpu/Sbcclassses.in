// Shared UI Components
import { C } from "../../constants/colors.js";

// Avatar Component
export const Avatar = ({ initials, size = 40, color = C.primary }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: `linear-gradient(135deg, ${color}CC, ${color}88)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 800,
      fontSize: size * 0.35,
      color: "#fff",
      border: `2px solid ${color}44`,
      boxShadow: `0 0 16px ${color}33`,
      fontFamily: "Georgia, serif",
    }}
  >
    {initials}
  </div>
);

// Badge Component
export const Badge = ({ text, type = "default" }) => {
  const map = {
    default: [C.bgCard3, C.textMuted],
    success: ["#10B98122", "#10B981"],
    danger: ["#EF444422", "#EF4444"],
    warning: ["#F59E0B22", "#F59E0B"],
    primary: ["#FF6B0022", "#FF6B00"],
    info: ["#3B82F622", "#3B82F6"],
    gold: ["#FFD70022", "#FFD700"],
  };
  const [bg, color] = map[type] || map.default;
  return (
    <span
      style={{
        background: bg,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 20,
        padding: "3px 11px",
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
};

// Card Component
export const Card = ({ children, style = {}, glow = false }) => (
  <div
    style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: 22,
      boxShadow: glow ? `0 0 30px ${C.primary}18` : "none",
      ...style,
    }}
  >
    {children}
  </div>
);

// Stat Component
export const Stat = ({ icon, label, value, sub, color = C.primary, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.bgCard,
      border: `1px solid ${onClick ? color + "44" : C.border}`,
      borderRadius: 16,
      padding: "20px 22px",
      display: "flex",
      gap: 16,
      alignItems: "center",
      position: "relative",
      overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.15s, box-shadow 0.15s",
      boxShadow: onClick ? `0 2px 12px ${color}18` : "none",
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`;
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 2px 12px ${color}18`;
      }
    }}
  >
    <div
      style={{
        position: "absolute",
        right: -8,
        top: -8,
        fontSize: 72,
        opacity: 0.04,
        pointerEvents: "none",
      }}
    >
      {icon}
    </div>
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: 14,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: C.textMuted }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>
          {sub}
        </div>
      )}
      {onClick && (
        <div
          style={{
            fontSize: 10,
            color: color,
            marginTop: 4,
            fontWeight: 700,
            opacity: 0.7,
          }}
        >
          Tap to view →
        </div>
      )}
    </div>
  </div>
);

// Progress Bar Component
export const PBar = ({ value, color = C.primary, height = 6 }) => (
  <div style={{ background: C.bgCard3, borderRadius: 99, height, overflow: "hidden" }}>
    <div
      style={{
        width: `${Math.min(value, 100)}%`,
        height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}BB)`,
        borderRadius: 99,
        transition: "width 1s ease",
      }}
    />
  </div>
);

// Input Component
export const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 16 }}>
    {label && (
      <label
        style={{
          color: C.textMuted,
          fontSize: 11,
          fontWeight: 700,
          display: "block",
          marginBottom: 7,
          letterSpacing: 0.8,
        }}
      >
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        width: "100%",
        padding: "11px 14px",
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: C.bgCard2,
        color: C.text,
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
        ...props.style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = C.primary;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = C.border;
      }}
    />
  </div>
);

// Button Component
export const Btn = ({ children, onClick, variant = "primary", size = "md", style = {}, id }) => {
  const sizes = { sm: "8px 16px", md: "12px 24px", lg: "15px 36px" };
  const variants = {
    primary: {
      background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
      color: "#fff",
      border: "none",
    },
    outline: { background: "transparent", color: C.primary, border: `1px solid ${C.primary}` },
    ghost: { background: C.bgCard2, color: C.text, border: `1px solid ${C.border}` },
    danger: { background: "#EF444422", color: "#EF4444", border: "1px solid #EF444444" },
    success: {
      background: "#10B98122",
      color: "#10B981",
      border: "1px solid #10B98144",
    },
    gold: {
      background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
      color: "#111",
      border: "none",
    },
  };
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        padding: sizes[size],
        borderRadius: 10,
        fontWeight: 700,
        fontSize: size === "sm" ? 12 : 14,
        cursor: "pointer",
        transition: "all 0.2s",
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// Modal Component
export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000BB",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: 28,
          maxWidth: 520,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ color: C.text, margin: 0, fontSize: 18, fontWeight: 800 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: C.textMuted,
              fontSize: 22,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
