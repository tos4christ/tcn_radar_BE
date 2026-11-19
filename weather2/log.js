/** Console logger with a prefix, and a helper that lets a repeating error be printed once in a while. */
const last = new Map();

function child(prefix) {
  const tag = `[${prefix}]`;
  return {
    info: (...a) => console.log(tag, ...a),
    warn: (...a) => console.warn(tag, ...a),
    error: (...a) => console.error(tag, ...a),
  };
}

/** true at most once per `ms` for the same key. */
function every(key, ms) {
  const now = Date.now();
  if (now - (last.get(key) || 0) < ms) return false;
  last.set(key, now);
  return true;
}

module.exports = { child, every };
