// Language management utilities
import { T, LANGUAGES } from "../constants/languages.js";

let _lang = localStorage.getItem("sbc_lang") || "en";

export const getLang = () => _lang;

export const setLang = (l) => {
  _lang = l;
  localStorage.setItem("sbc_lang", l);
  window.location.reload(); // Reload to apply language changes
};

export const t = (key) => (T[_lang]?.[key] ?? T.en[key] ?? key);

export { LANGUAGES };
