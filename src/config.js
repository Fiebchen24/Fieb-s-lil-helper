require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[config] Missing environment variable: ${name}`);
  }
  return value || '';
}

module.exports = {
  token: required('DISCORD_TOKEN'),
  clientId: required('DISCORD_CLIENT_ID'),
  guildId: required('DISCORD_GUILD_ID'),
  trustedThreshold: Number(process.env.TRUSTED_REPUTATION_THRESHOLD || 15),
  schedulerIntervalMs: Number(process.env.SCHEDULER_INTERVAL_MS || 60000),
  channels: {
    signup: required('SIGNUP_CHANNEL_ID'),
    checkin: required('CHECKIN_CHANNEL_ID'),
    lobby: required('LOBBY_CHANNEL_ID'),
    resultsReview: process.env.RESULTS_REVIEW_CHANNEL_ID || '',
    proof: process.env.PROOF_CHANNEL_ID || '',
    leaderboard: required('LEADERBOARD_CHANNEL_ID'),
    staffLog: required('STAFF_LOG_CHANNEL_ID'),
    penalties: required('PENALTIES_CHANNEL_ID'),
    hostPanel: required('HOST_PANEL_CHANNEL_ID')
  },
  roles: {
    host: required('HOST_ROLE_ID'),
    seniorHost: required('SENIOR_HOST_ROLE_ID'),
    resultStaff: process.env.RESULT_STAFF_ROLE_ID || '',
    moderator: required('MODERATOR_ROLE_ID'),
    registered: required('REGISTERED_ROLE_ID'),
    checkedIn: required('CHECKEDIN_ROLE_ID'),
    queued: required('QUEUED_ROLE_ID'),
    banned: process.env.BANNED_ROLE_ID || '',
    trusted: process.env.TRUSTED_PLAYER_ROLE_ID || ''
  }
};
