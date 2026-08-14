const sessions = new Map();

function getSession(phone) {
  let session = sessions.get(phone);
  if (!session || (Date.now() - session.lastActive > 30 * 60 * 1000)) {
    session = { state: 'INIT', data: {}, lastActive: Date.now() };
    sessions.set(phone, session);
  } else {
    session.lastActive = Date.now();
  }
  return session;
}

function updateSession(phone, updates) {
  const session = getSession(phone);
  Object.assign(session, updates);
  sessions.set(phone, session);
}

function resetSession(phone) {
  const session = { state: 'INIT', data: {}, lastActive: Date.now() };
  sessions.set(phone, session);
  return session;
}

module.exports = { getSession, updateSession, resetSession };
