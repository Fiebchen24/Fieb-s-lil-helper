const state = {
  lobbyCodes: new Map()
};

function setLobbyCode(eventId, code) {
  state.lobbyCodes.set(String(eventId), code);
}

function getLobbyCode(eventId) {
  return state.lobbyCodes.get(String(eventId));
}

function clearLobbyCode(eventId) {
  state.lobbyCodes.delete(String(eventId));
}

module.exports = {
  setLobbyCode,
  getLobbyCode,
  clearLobbyCode
};
