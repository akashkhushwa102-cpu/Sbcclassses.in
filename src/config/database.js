/* ============================================================
   SBC LOCAL CACHE / DB SHIM
   ------------------------------------------------------------
   The legacy `App.jsx` reads/writes data via DB.get / DB.set.
   In demo mode this was just localStorage; in production the
   real source of truth is the Node + MongoDB backend exposed
   through `services/apiClient.js`.

   This module:
     • keeps the synchronous DB.get/set/del API intact (so the
       6,800-line App.jsx keeps working);
     • adds async `syncAll` / `sync<X>` helpers that pull live
       data from the backend and update the local cache;
     • mirrors writes to the backend in the background (best
       effort) for the entities that have an API.

   The result: any batch the admin creates is persisted to
   MongoDB and shows up for students immediately on next
   refresh / when initDB() runs.
   ============================================================ */

import {
  apiCall, batchAPI, planAPI, noticeAPI, userAPI, subscriptionAPI,
  authAPI, auth as authStore,
} from '../services/apiClient.js';

const PREFIX = 'sbc_';

// In-memory cache of last known synced plan IDs to detect deletes
let lastSyncedPlanIds = new Set();

const safeParse = (v) => {
  if (v === null || v === undefined) return null;
  try { return JSON.parse(v); } catch { return v; }
};

export const DB = {
  get(key) {
    const val = safeParse(localStorage.getItem(`${PREFIX}${key}`));
    // If requesting batches, and an onboarding selection exists for the
    // current user, filter batches to only show relevant class/board.
    if (key === 'batches' && Array.isArray(val)) {
      let onboard = null;
      try { onboard = (authStore.getUser() && authStore.getUser().onboarding) || safeParse(localStorage.getItem('sbc_onboarding')); } catch (_) { onboard = null; }
      if (onboard && (onboard.class || onboard.board || onboard.boardType)) {
        return val.filter(b => {
          const matchClass = onboard.class ? String(b.class) === String(onboard.class) : true;
          // onboard.board may be full like 'State Board - Karnataka' or simple boardType
          let matchBoard = true;
          if (onboard.board) {
            matchBoard = String(b.board || b.boardName || '') === String(onboard.board);
          } else if (onboard.boardType) {
            if (onboard.boardType === 'State Board') {
              // match any state board that includes the state name
              matchBoard = String(b.board || b.boardName || '').toLowerCase().includes((onboard.state || '').toLowerCase());
            } else {
              matchBoard = String(b.board || b.boardName || '').toLowerCase().includes(String(onboard.boardType).toLowerCase());
            }
          }
          return matchClass && matchBoard;
        });
      }
    }
    // Filter appCourses similarly by onboarding selection
    if (key === 'appCourses' && Array.isArray(val)) {
      let onboard = null;
      try { onboard = (authStore.getUser() && authStore.getUser().onboarding) || safeParse(localStorage.getItem('sbc_onboarding')); } catch (_) { onboard = null; }
      if (onboard && (onboard.class || onboard.board || onboard.boardType)) {
        return val.filter(c => {
          const matchClass = onboard.class && c.class ? String(c.class) === String(onboard.class) : (onboard.class ? false : true);
          let matchBoard = true;
          if (onboard.board) {
            matchBoard = String(c.board || c.boardType || '').toLowerCase() === String(onboard.board).toLowerCase();
          } else if (onboard.boardType) {
            if (onboard.boardType === 'State Board') {
              matchBoard = String(c.state || c.board || '').toLowerCase().includes((onboard.state || '').toLowerCase()) || String(c.boardType || '').toLowerCase() === 'state board';
            } else {
              matchBoard = String(c.boardType || c.board || '').toLowerCase().includes(String(onboard.boardType).toLowerCase());
            }
          }
          return matchBoard && (onboard.class ? matchClass : true);
        });
      }
    }
    return val;
  },
  set(key, val) {
    try {
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(val));
      // Best-effort backend mirror for known collections.
      mirrorWrite(key, val);
    } catch (err) {
      console.error('DB.set error:', key, err);
    }
  },
  del(key) {
    localStorage.removeItem(`${PREFIX}${key}`);
  },
  // Used by some admin pages — fall back to plain get.
  admin(key) {
    return DB.get(key);
  },
};

// =============================================================
// BACKEND SYNC — pull from API into the local cache.
// =============================================================
const ok = (resp) => (resp && (resp.data ?? resp));

const pickArray = (resp) => {
  const d = ok(resp);
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  return d || [];
};

export const sync = {
  async batches() {
    try {
      const isAdminOrTeacher = ['admin', 'teacher'].includes(authStore.getUser()?.role);
      const resp = isAdminOrTeacher ? await batchAPI.listAllForAdmin() : await batchAPI.list({ limit: 200 });
      const list = pickArray(resp);
      localStorage.setItem(`${PREFIX}batches`, JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('sync.batches failed:', err.message);
      return DB.get('batches') || [];
    }
  },
  async plans() {
    try {
      // Attach onboarding filters (if present) so backend can return class/board-specific plans
      let params = { includeInactive: 1 };
      try { const onboard = (authStore.getUser() && authStore.getUser().onboarding) || safeParse(localStorage.getItem('sbc_onboarding')); if (onboard) {
        if (onboard.board) params.board = onboard.board;
        else if (onboard.boardType) params.board = onboard.boardType === 'State Board' && onboard.state ? `State Board - ${onboard.state}` : onboard.boardType;
        if (onboard.state) params.state = onboard.state;
        if (onboard.class) params.class = onboard.class;
      } } catch (_) {}
      const resp = await planAPI.list(params);
      const list = pickArray(resp);
      localStorage.setItem(`${PREFIX}subscriptionPlans`, JSON.stringify(list));
      // Update in-memory snapshot and notify UI that plans updated.
      try {
        lastSyncedPlanIds = new Set((list || []).map(idOf).filter(Boolean));
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('sbc:plans-updated', { detail: { count: list.length } }));
        }
      } catch (_) { /* ignore */ }
      return list;
    } catch (err) {
      console.warn('sync.plans failed:', err.message);
      return DB.get('subscriptionPlans') || [];
    }
  },
  async notices() {
    try {
      const resp = await noticeAPI.list();
      const list = pickArray(resp);
      localStorage.setItem(`${PREFIX}notices`, JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('sync.notices failed:', err.message);
      return DB.get('notices') || [];
    }
  },
  async students() {
    try {
      const resp = await userAPI.list({ role: 'student', limit: 200 });
      const list = pickArray(resp);
      localStorage.setItem(`${PREFIX}students`, JSON.stringify(list));
      return list;
    } catch (err) { return DB.get('students') || []; }
  },
  async teachers() {
    try {
      const resp = await userAPI.list({ role: 'teacher', limit: 200 });
      const list = pickArray(resp);
      localStorage.setItem(`${PREFIX}teachers`, JSON.stringify(list));
      return list;
    } catch (err) { return DB.get('teachers') || []; }
  },
  async mySubscriptions() {
    try {
      const resp = await subscriptionAPI.mine();
      const list = pickArray(resp);
      localStorage.setItem(`${PREFIX}mySubscriptions`, JSON.stringify(list));
      return list;
    } catch (err) { return DB.get('mySubscriptions') || []; }
  },
  async all() {
    const tasks = [sync.batches(), sync.plans(), sync.notices()];
    // Only admins can list ALL users via /api/users — teachers/students would
    // get 403 from the backend (and flood the logs with warnings).
    if (authStore.getUser()?.role === 'admin') {
      tasks.push(sync.students(), sync.teachers());
    }
    if (authStore.getToken()) tasks.push(sync.mySubscriptions());
    await Promise.allSettled(tasks);
  },
};

// =============================================================
// MIRROR WRITES — when admin pages still use DB.set('batches', …)
// we mirror create/update operations to the backend.
// =============================================================
function mirrorWrite(key, value) {
  if (key === 'batches' && Array.isArray(value)) {
    pushBatches(value).catch((err) => console.warn('mirrorWrite batches:', err.message));
  } else if (key === 'subscriptionPlans' && Array.isArray(value)) {
    pushPlans(value).catch((err) => console.warn('mirrorWrite plans:', err.message));
  } else if (key === 'notices' && Array.isArray(value)) {
    pushNotices(value).catch((err) => console.warn('mirrorWrite notices:', err.message));
  }
}

const isMongoId = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);
const idOf = (obj) => obj?._id || obj?.id || null;

async function pushBatches(list) {
  if (!authStore.getToken()) return;
  for (const b of list) {
    const id = idOf(b);
    const payload = {
      name: b.name,
      description: b.description || '',
      subject: b.subject || '',
      level: b.level || '',
      // map legacy UI fields to backend schema
      classLevel: b.class && b.class !== 'All Classes' ? Number(b.class) : (b.classLevel ?? null),
      board: b.board || (b.boardType ? b.boardType : null),
      state: b.state || null,
      price: Number(b.price) || 0,
      duration: Number(b.duration) || 30,
      capacity: Number(b.capacity) || 0,
      schedule: b.schedule || '',
      teacherId: b.teacherId && isMongoId(b.teacherId) ? b.teacherId : null,
      coverImage: b.coverImage || '',
      features: b.features || [],
      isPublished: !!b.isPublished,
    };
    try {
      if (isMongoId(id)) {
        await batchAPI.update(id, payload);
      } else if (!b.__synced) {
        const resp = await batchAPI.create(payload);
        const created = ok(resp);
        b._id = created?._id || id;
        b.__synced = true;
      }
    } catch (err) {
      console.warn('mirror batch failed:', err.message);
    }
  }
}

async function pushPlans(list) {
  if (!authStore.getToken()) return;
  // Detect deletes by comparing previously-synced IDs with the incoming list.
  try {
    const incomingIds = new Set((list || []).map(idOf).filter(Boolean));
    const removed = [...lastSyncedPlanIds].filter((id) => !incomingIds.has(id));
    for (const rid of removed) {
      try { await planAPI.remove(rid); } catch (err) { /* ignore individual failures */ }
    }
  } catch (_) { /* ignore */ }

  for (const p of list) {
    const id = idOf(p);
    // Build accessSelectors from newer or legacy UI fields so mirror writes
    // include the selectors the backend expects.
    const accessSelectors = p.accessSelectors || {
      boards: p.accessBoards || p.boards || [],
      states: p.accessStates || p.states || [],
      classes: p.accessClasses || p.classes || [],
      batches: (p.accessBatchIds || p.batchIds || p.batches || []).filter(isMongoId),
    };

    const payload = {
      name: p.name,
      type: p.type || (p.batchId ? 'batch' : 'all_access'),
      batchId: p.batchId && isMongoId(p.batchId) ? p.batchId : null,
      description: p.description || '',
      price: Number(p.price) || 0,
      duration: Number(p.duration) || 30,
      billingCycle: p.billingCycle || 'custom',
      features: p.features || [],
      isActive: p.isActive !== false,
      sortOrder: p.sortOrder || 0,
      accessSelectors,
      batchIds: (p.batchIds || []).filter(isMongoId),
      subjects: p.subjects || [],
      grantsPremiumContent: !!p.grantsPremiumContent,
      offerPercentage: Number(p.offerPercentage) || 0,
      metadata: p.metadata || {},
    };
    try {
      if (isMongoId(id)) await planAPI.update(id, payload);
      else if (!p.__synced) {
        const created = ok(await planAPI.create(payload));
        p._id = created?._id || id;
        p.__synced = true;
      }
    } catch (err) {
      console.warn('mirror plan failed:', err.message);
    }
  }
  // After push, refresh our snapshot to reflect the new state
  try { lastSyncedPlanIds = new Set((list || []).map(idOf).filter(Boolean)); } catch (_) { /* ignore */ }
}

// Listen for other tabs updating localStorage for these collections and
// trigger a background sync so student pages pick up admin changes quickly.
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('storage', (e) => {
    try {
      if (!e.key) return;
      if (e.key === `${PREFIX}subscriptionPlans`) {
        sync.plans().catch(() => {});
      } else if (e.key === `${PREFIX}batches`) {
        sync.batches().catch(() => {});
      } else if (e.key === `${PREFIX}notices`) {
        sync.notices().catch(() => {});
      }
    } catch (_) { /* ignore */ }
  });
}

async function pushNotices(list) {
  if (!authStore.getToken()) return;
  for (const n of list) {
    const id = idOf(n);
    if (isMongoId(id)) continue;
    if (n.__synced) continue;
    try {
      const created = ok(await noticeAPI.create({
        title: n.title,
        body: n.body || n.message || '',
        audience: n.audience || 'all',
        pinned: !!n.pinned,
      }));
      n._id = created?._id;
      n.__synced = true;
    } catch (err) {
      console.warn('mirror notice failed:', err.message);
    }
  }
}

// =============================================================
// initDB — pulls data from the backend so the local cache is
//          always seeded with the latest state on app start.
// =============================================================
export const initDB = async () => {
  if (DB.get('initialized') !== 'mongo-v4') {
    ['batches', 'subscriptionPlans', 'notices', 'students', 'teachers', 'mySubscriptions']
      .forEach((k) => DB.del(k));
    localStorage.setItem(`${PREFIX}initialized`, JSON.stringify('mongo-v4'));
  }
  const savedUser = authStore.getUser();
  if (savedUser && authStore.getToken()) {
    try { await authAPI.me(); } catch (_) { authStore.clear(); }
  }
  await sync.all();
};
