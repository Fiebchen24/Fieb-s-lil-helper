const { run, get } = require('../db/database');
const config = require('../config');

function ensureUser(user) {
  run(
    `INSERT INTO users (discord_id, username)
     VALUES (:discord_id, :username)
     ON CONFLICT(discord_id) DO UPDATE SET username = excluded.username, updated_at = CURRENT_TIMESTAMP`,
    {
      discord_id: user.id,
      username: user.username
    }
  );
}

function incrementField(discordId, field, amount = 1) {
  const allowed = new Set(['total_events', 'total_no_shows', 'total_penalties', 'reputation']);
  if (!allowed.has(field)) {
    throw new Error(`Unsupported field increment: ${field}`);
  }

  run(
    `UPDATE users SET ${field} = ${field} + :amount, updated_at = CURRENT_TIMESTAMP WHERE discord_id = :discord_id`,
    { discord_id: discordId, amount }
  );
}

function getUser(discordId) {
  return get(`SELECT * FROM users WHERE discord_id = :discord_id`, { discord_id: discordId });
}

function isTrusted(discordId) {
  const user = getUser(discordId);
  if (!user) return false;
  return user.reputation >= config.trustedThreshold;
}

async function syncTrustedRole(member) {
  const trustedRoleId = config.roles.trusted;
  if (!trustedRoleId || !member) return;

  const shouldHave = isTrusted(member.id);
  const hasRole = member.roles.cache.has(trustedRoleId);

  if (shouldHave && !hasRole) {
    await member.roles.add(trustedRoleId).catch(() => {});
  }

  if (!shouldHave && hasRole) {
    await member.roles.remove(trustedRoleId).catch(() => {});
  }
}

async function applyReputationDelta(member, amount) {
  incrementField(member.id, 'reputation', amount);
  await syncTrustedRole(member);
}

module.exports = {
  ensureUser,
  incrementField,
  getUser,
  isTrusted,
  syncTrustedRole,
  applyReputationDelta
};
