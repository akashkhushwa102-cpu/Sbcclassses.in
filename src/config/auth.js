// Authentication Configuration
import { DB } from "./database.js";
import SEC from "./security.js";

// Hashed credentials (never store plain passwords)
export const AUTH_DB = {
  admin: {
    id: "SBC_OWNER",
    passHash: SEC.hash("Owner@SBC#2024!"),
    name: "Owner / Administrator",
    secretKey: "SBC2024",
  },
  teachers: {
    get: () => (DB.get("teachers") || []).filter(t => t.status === "Approved"),
  },
  students: {
    get: () => (DB.get("students") || []).filter(s => s.status === "Approved"),
  },
};

export { SEC };
