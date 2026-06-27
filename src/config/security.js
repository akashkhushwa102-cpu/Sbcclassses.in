// Security Layer - Hashing, OTP, Session Management
const SEC = {
  // Hash function (simple implementation - use crypto in production)
  hash: (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  },

  // Encryption (simple base64 - use proper encryption in production)
  encrypt: (data, key = "SBC_SECURE_2024") => {
    try {
      return btoa(JSON.stringify(data));
    } catch {
      return null;
    }
  },

  // Decryption
  decrypt: (data, key = "SBC_SECURE_2024") => {
    try {
      return JSON.parse(atob(data));
    } catch {
      return null;
    }
  },

  // Token generation
  genToken: (role, id) => {
    const payload = { role, id, time: Date.now() };
    return this.encrypt(payload);
  },

  // Token validation
  validateToken: (token) => {
    try {
      const payload = this.decrypt(token);
      return payload && payload.time && Date.now() - payload.time < 86400000; // 24hrs
    } catch {
      return false;
    }
  },

  // Rate limiting
  checkRateLimit: (key) => {
    const attempts = JSON.parse(localStorage.getItem(`rl_${key}`) || "[]");
    const now = Date.now();
    const recent = attempts.filter(t => now - t < 600000); // 10 mins
    if (recent.length >= 5) return false;
    recent.push(now);
    localStorage.setItem(`rl_${key}`, JSON.stringify(recent));
    return true;
  },

  clearRateLimit: (key) => localStorage.removeItem(`rl_${key}`),

  // Event logging
  logEvent: (type, detail) => {
    const logs = JSON.parse(localStorage.getItem("sbc_logs") || "[]");
    logs.push({ type, detail, time: new Date().toISOString() });
    localStorage.setItem("sbc_logs", JSON.stringify(logs.slice(-100)));
  },

  // Phone/Email masking
  maskPhone: (p) => (p ? p.slice(0, 3) + "****" + p.slice(-3) : "—"),
  maskEmail: (e) => {
    if (!e) return "—";
    const parts = e.split("@");
    return parts[0].slice(0, 2) + "****@" + parts[1];
  },

  // OTP Management
  generateOTP: (identifier) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = Date.now() + 600000; // 10 mins
    localStorage.setItem(`otp_${identifier}`, JSON.stringify({ otp, expiry }));
    this.logEvent("OTP_GENERATED", identifier);
    return otp;
  },

  verifyOTP: (identifier, inputOtp) => {
    const stored = JSON.parse(localStorage.getItem(`otp_${identifier}`) || "{}");
    if (!stored.otp || Date.now() > stored.expiry) {
      this.logEvent("OTP_EXPIRED", identifier);
      return false;
    }
    if (stored.otp === inputOtp) {
      localStorage.removeItem(`otp_${identifier}`);
      this.logEvent("OTP_VERIFIED", identifier);
      return true;
    }
    this.logEvent("OTP_FAILED", identifier);
    return false;
  },

  // Session Management
  createSession: (userId, role) => {
    const token = this.genToken(role, userId);
    const session = { userId, role, token, createdAt: Date.now() };
    localStorage.setItem("sbc_session", JSON.stringify(session));
    this.logEvent("SESSION_CREATED", userId);
    return session;
  },

  setSession: (token, role, user) => {
    const session = { token, role, user, createdAt: Date.now() };
    localStorage.setItem("sbc_session", JSON.stringify(session));
    this.logEvent("SESSION_SET", user?.id);
  },

  getSession: () => {
    try {
      const session = JSON.parse(localStorage.getItem("sbc_session") || "null");
      if (session && Date.now() - session.createdAt < 86400000) {
        return session;
      }
      return null;
    } catch {
      return null;
    }
  },

  clearSession: () => {
    localStorage.removeItem("sbc_session");
    this.logEvent("SESSION_CLEARED", "");
  },

  isLoggedIn: () => {
    const session = this.getSession();
    return session ? this.validateToken(session.token) : false;
  },
};

export default SEC;
