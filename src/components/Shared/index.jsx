// Language Switcher Component
import { useState } from "react";
import { C } from "../../constants/colors.js";
import { LANGUAGES, T } from "../../constants/languages.js";
import { getLang, setLang } from "../../utils/translate.js";

export const LangSwitcher = ({ style = {} }) => {
  const [cur, setCur] = useState(getLang());
  const [open, setOpen] = useState(false);

  const change = (l) => {
    setLang(l);
    setCur(l);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", ...style }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "none",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: "5px 10px",
          cursor: "pointer",
          color: C.text,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontWeight: 600,
        }}
      >
        {LANGUAGES[cur]?.flag} {LANGUAGES[cur]?.name} ▾
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 6,
            zIndex: 9999,
            minWidth: 160,
            boxShadow: `0 8px 32px ${C.primary}22`,
          }}
        >
          {Object.entries(LANGUAGES).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => change(code)}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: cur === code ? `${C.primary}15` : "none",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                color: cur === code ? C.primary : C.text,
                fontSize: 13,
                fontWeight: cur === code ? 700 : 400,
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Copy Button Component
export const CopyBtn = ({ text, label = "Copy", big = false }) => {
  const [copied, setCopied] = useState(false);

  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handle}
      style={{
        background: copied ? C.success : C.bgCard2,
        border: `1px solid ${copied ? "#10B98144" : C.border}`,
        color: copied ? C.success : C.textMuted,
        padding: big ? "11px 18px" : "6px 11px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: big ? 13 : 11,
        fontWeight: 600,
        transition: "all 0.2s",
      }}
    >
      {copied ? "✓ Copied!" : label}
    </button>
  );
};
