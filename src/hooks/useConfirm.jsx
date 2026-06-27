// Hook for confirmation dialogs (replaces window.confirm)
import React, { useState } from "react";
import { C } from "../constants/colors.js";

export const useConfirm = () => {
  const [state, setState] = useState({ open: false, msg: "", resolve: null });

  const confirm = (msg) =>
    new Promise((res) => setState({ open: true, msg, resolve: res }));

  const Dialog = state.open ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: C.bgCard,
          borderRadius: 18,
          padding: "24px 28px",
          maxWidth: 340,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          border: `1px solid ${C.border}`,
        }}
      >
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>
          ⚠️
        </div>
        <p
          style={{
            color: C.text,
            fontSize: 15,
            textAlign: "center",
            lineHeight: 1.6,
            margin: "0 0 20px",
            fontWeight: 600,
          }}
        >
          {state.msg}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              state.resolve?.(false);
              setState({ open: false, msg: "", resolve: null });
            }}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 11,
              border: `1px solid ${C.border}`,
              background: C.bgCard2,
              color: C.textMuted,
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              state.resolve?.(true);
              setState({ open: false, msg: "", resolve: null });
            }}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 11,
              border: "none",
              background: C.danger,
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, Dialog };
};
