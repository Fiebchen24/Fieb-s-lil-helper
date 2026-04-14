const { run, get, all } = require('../db/database');

function recordInviteJoin({ guildId, inviter, invitedUser, inviteCode = null }) {
  if (!inviter || !invitedUser) return;
  run(
    `INSERT INTO invite_joins (
      guild_id, inviter_discord_id, inviter_username, invited_discord_id, invited_username, invite_code
    ) VALUES (
      :guild_id, :inviter_discord_id, :inviter_username, :invited_discord_id, :invited_username, :invite_code
    )
    ON CONFLICT(invited_discord_id) DO UPDATE SET
      guild_id = excluded.guild_id,
      inviter_discord_id = excluded.inviter_discord_id,
      inviter_username = excluded.inviter_username,
      invited_username = excluded.invited_username,
      invite_code = excluded.invite_code,
      joined_at = CURRENT_TIMESTAMP`,
    {
      guild_id: guildId,
      inviter_discord_id: inviter.id,
      inviter_username: inviter.username,
      invited_discord_id: invitedUser.id,
      invited_username: invitedUser.username,
      invite_code: inviteCode
    }
  );
}

function getPendingInviteCount(discordId) {
  return get(
    `SELECT COUNT(*) AS count
     FROM invite_joins
     WHERE inviter_discord_id = :discord_id AND reward_processed = 0`,
    { discord_id: discordId }
  )?.count || 0;
}

function markPendingInvitesProcessed(discordId) {
  run(
    `UPDATE invite_joins
     SET reward_processed = 1
     WHERE inviter_discord_id = :discord_id AND reward_processed = 0`,
    { discord_id: discordId }
  );
}

function getInviteStats(discordId) {
  return get(
    `SELECT
      COUNT(*) AS total_invites,
      COALESCE(SUM(CASE WHEN reward_processed = 0 THEN 1 ELSE 0 END), 0) AS pending_invites,
      COALESCE(SUM(CASE WHEN reward_processed = 1 THEN 1 ELSE 0 END), 0) AS processed_invites
     FROM invite_joins
     WHERE inviter_discord_id = :discord_id`,
    { discord_id: discordId }
  ) || { total_invites: 0, pending_invites: 0, processed_invites: 0 };
}

function listRecentInvites(discordId, limit = 10) {
  return all(
    `SELECT invited_username, invite_code, reward_processed, joined_at
     FROM invite_joins
     WHERE inviter_discord_id = :discord_id
     ORDER BY datetime(joined_at) DESC
     LIMIT :limit`,
    { discord_id: discordId, limit }
  );
}

module.exports = {
  recordInviteJoin,
  getPendingInviteCount,
  markPendingInvitesProcessed,
  getInviteStats,
  listRecentInvites
};
