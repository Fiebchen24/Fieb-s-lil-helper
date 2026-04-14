const { run, get, all } = require('../db/database');

function createGiveaway({ title, prize, winnerCount = 1, notes = null, createdBy }) {
  const result = run(
    `INSERT INTO giveaways (title, prize, winner_count, notes, created_by_discord_id, created_by_username)
     VALUES (:title, :prize, :winner_count, :notes, :created_by_discord_id, :created_by_username)`,
    {
      title,
      prize,
      winner_count: winnerCount,
      notes,
      created_by_discord_id: createdBy.id,
      created_by_username: createdBy.username
    }
  );
  return getGiveawayById(Number(result.lastInsertRowid));
}

function getGiveawayById(id) {
  return get(`SELECT * FROM giveaways WHERE id = :id`, { id });
}

function getLatestOpenGiveaway() {
  return get(`SELECT * FROM giveaways WHERE status = 'open' ORDER BY id DESC LIMIT 1`);
}

function closeGiveaway(id) {
  run(`UPDATE giveaways SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = :id`, { id });
}

function addEntry({ giveawayId, user, invitesCount = 1, proofNote = null, verifiedBy }) {
  const entries = Math.max(1, Number(invitesCount) || 1);
  run(
    `INSERT INTO giveaway_entries (
      giveaway_id, discord_id, username, entries, invites_count, proof_note, verified_by_discord_id, verified_by_username
    ) VALUES (
      :giveaway_id, :discord_id, :username, :entries, :invites_count, :proof_note, :verified_by_discord_id, :verified_by_username
    )`,
    {
      giveaway_id: giveawayId,
      discord_id: user.id,
      username: user.username,
      entries,
      invites_count: invitesCount,
      proof_note: proofNote,
      verified_by_discord_id: verifiedBy.id,
      verified_by_username: verifiedBy.username
    }
  );
}

function listEntries(giveawayId) {
  return all(
    `SELECT * FROM giveaway_entries WHERE giveaway_id = :giveaway_id ORDER BY created_at ASC, id ASC`,
    { giveaway_id: giveawayId }
  );
}

function getSummary(giveawayId) {
  return get(
    `SELECT
       COUNT(*) AS submission_count,
       COUNT(DISTINCT discord_id) AS participant_count,
       COALESCE(SUM(entries), 0) AS total_entries,
       COALESCE(SUM(invites_count), 0) AS total_invites
     FROM giveaway_entries
     WHERE giveaway_id = :giveaway_id`,
    { giveaway_id: giveawayId }
  );
}

function getParticipantBreakdown(giveawayId) {
  return all(
    `SELECT discord_id, username, SUM(entries) AS entries, SUM(invites_count) AS invites_count
     FROM giveaway_entries
     WHERE giveaway_id = :giveaway_id
     GROUP BY discord_id, username
     ORDER BY entries DESC, username COLLATE NOCASE ASC`,
    { giveaway_id: giveawayId }
  );
}

function buildWheelLines(giveawayId) {
  const participants = getParticipantBreakdown(giveawayId);
  const lines = [];
  for (const person of participants) {
    for (let i = 0; i < person.entries; i += 1) {
      lines.push(person.username);
    }
  }
  return lines;
}

module.exports = {
  createGiveaway,
  getGiveawayById,
  getLatestOpenGiveaway,
  closeGiveaway,
  addEntry,
  listEntries,
  getSummary,
  getParticipantBreakdown,
  buildWheelLines
};
