// Toast notification hook
import React, { useEffect, useState } from "react";
import { C } from "../constants/colors.js";

// Global state for toast
let _toastSetFn = null;

export const toast = (msg, type = "success", duration = 3000) => {
  if (_toastSetFn) {
    _toastSetFn({ msg, type, visible: true, duration });
    setTimeout(() => _toastSetFn({ msg: "", type: "success", visible: false }), duration);
  }
};

export const useToast = () => {
  const [state, setState] = useState({ msg: "", type: "success", visible: false, duration: 3000 });

  // Set global toast function when component mounts
  useEffect(() => {
    _toastSetFn = setState;
    return () => {
      _toastSetFn = null;
    };
  }, []);

  const Toast = state.visible ? (
    <div
      style={{
        position: "fixed",
        bottom: 30,
        left: 20,
        background: state.type === "success" ? C.success : state.type === "error" ? C.danger : C.warning,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 10000,
        animation: "slideUp 0.3s ease",
      }}
    >
      {state.msg}
    </div>
  ) : null;

  return Toast;
};
