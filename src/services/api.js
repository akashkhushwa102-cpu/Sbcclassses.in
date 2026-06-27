/* ============================================================
   LEGACY API ALIASES
   ------------------------------------------------------------
   Older code imported `authAPI`, `studentAPI`, `teacherAPI`,
   `batchAPI`, etc. from `./api`. We now standardize on
   `./apiClient.js` but keep these names as aliases so existing
   imports continue to work.
   ============================================================ */

import api, {
  apiCall, auth as authStore, authAPI, userAPI, batchAPI, planAPI,
  subscriptionAPI, paymentAPI, noticeAPI, contentAPI, adminAPI,
} from './apiClient.js';

// Aliases for the old service-name shape
export const studentAPI = {
  getAll: () => userAPI.list({ role: 'student', limit: 200 }),
  getById: (id) => userAPI.get(id),
  create: (data) => userAPI.create({ ...data, role: 'student' }),
  update: (id, data) => userAPI.update(id, data),
  delete: (id) => userAPI.remove(id),
};

export const teacherAPI = {
  getAll: () => userAPI.list({ role: 'teacher', limit: 200 }),
  getById: (id) => userAPI.get(id),
  create: (data) => userAPI.create({ ...data, role: 'teacher' }),
  update: (id, data) => userAPI.update(id, data),
  delete: (id) => userAPI.remove(id),
};

export {
  apiCall, authStore, authAPI, userAPI, batchAPI, planAPI,
  subscriptionAPI, paymentAPI, noticeAPI, contentAPI, adminAPI,
};

export default api;
