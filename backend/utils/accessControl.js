// Utility to determine whether a target (batch or candidate) matches the
// provided selectors. Selectors shape:
// { boards: [String], states: [String], classes: [Number], batches: [ObjectId] }

// Simple ObjectId validator (24 hex chars)
export const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v));

export const matchesAccess = (selectors = {}, target = {}) => {
  // If selectors is falsy or all arrays empty -> no automatic grant
  const { boards = [], states = [], classes = [], batches = [] } = selectors || {};
  const { board, state, classLevel, batchId } = target || {};

  // If explicit batch id is included, grant immediately
  if (batchId && batches.some((b) => String(b) === String(batchId))) return true;

  // Board match (empty means no-match)
  if (boards.length > 0) {
    if (!board) return false;
    const lowered = boards.map((b) => String(b).toLowerCase());
    if (!lowered.includes(String(board).toLowerCase()) && !lowered.includes('all')) return false;
  }

  // State match
  if (states.length > 0) {
    if (!state) return false;
    const loweredStates = states.map((s) => String(s).toLowerCase());
    if (!loweredStates.includes(String(state).toLowerCase()) && !loweredStates.includes('all states')) return false;
  }

  // Class match
  if (classes.length > 0) {
    if (classLevel == null) return false;
    const loweredClasses = classes.map((c) => String(c).toLowerCase());
    if (loweredClasses.includes('all classes')) return true;
    if (!classes.includes(Number(classLevel))) return false;
  }

  // If any selector array was non-empty and passed above checks, grant.
  if (boards.length > 0 || states.length > 0 || classes.length > 0) return true;

  // Nothing matched/selected
  return false;
};

export default { matchesAccess, isObjectId };