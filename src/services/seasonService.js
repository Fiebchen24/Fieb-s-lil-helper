const { run, get, all } = require('../db/database');

function addPoints({ eventId = null, user, points, source = 'manual', note = null, awardedBy }) {
  run(
    `INSERT INTO season_points (event_id, discord_id, username, points, source, note, awarded_by)
     VALUES (:event_id, :discord_id, :username, :points, :source, :note, :awarded_by)`,
    {
      event_id: eventId,
      discord_id: user.id,
      username: user.username,
      points,
      source,
      note,
      awarded_by: awardedBy
    }
  );
}

function getTotalPoints(discordId) {
  return get(
    `SELECT COALESCE(SUM(points), 0) AS total_points
     FROM season_points
     WHERE discord_id = :discord_id`,
    { discord_id: discordId }
  )?.total_points || 0;
}

function getLeaderboard(limit = 10) {
  return all(
    `SELECT discord_id, username, COALESCE(SUM(points), 0) AS total_points
     FROM season_points
     GROUP BY discord_id, username
     ORDER BY total_points DESC, username COLLATE NOCASE ASC
     LIMIT :limit`,
    { limit }
  );
}

module.exports = {
  addPoints,
  getTotalPoints,
  getLeaderboard
};
