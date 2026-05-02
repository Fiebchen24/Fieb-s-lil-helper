require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN || process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  schedulerIntervalMs: Number(process.env.SCHEDULER_INTERVAL_MS || 60000),
  timezone: process.env.TIMEZONE || 'Europe/Berlin',

  channels: {
    signup: process.env.CHANNEL_SIGNUP,
    checkin: process.env.CHANNEL_CHECKIN,
    leaderboard: process.env.CHANNEL_LEADERBOARD,
    hostPanel: process.env.CHANNEL_HOST_PANEL,
    lobby: process.env.CHANNEL_LOBBY,
    staffLog: process.env.CHANNEL_STAFF_LOG,
    penaltyLog: process.env.CHANNEL_PENALTY_LOG,
    paymentLog: process.env.CHANNEL_PAYMENT_LOG,
    dashboard: process.env.CHANNEL_DASHBOARD
  },

  roles: {
    staff: (process.env.STAFF_ROLE_IDS || '').split(',').map(x => x.trim()).filter(Boolean),
    registered: process.env.ROLE_REGISTERED,
    checkedIn: process.env.ROLE_CHECKED_IN,
    queued: process.env.ROLE_QUEUED,
    banned: process.env.ROLE_EVENT_BANNED,
    trusted: process.env.ROLE_TRUSTED,
    eventBan: process.env.ROLE_EVENT_BANNED
  },

  bot: {
    name: process.env.BOT_NAME || 'Fiebs Little Helper'
  }
};
