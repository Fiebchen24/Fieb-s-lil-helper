const { run, get, all } = require('../db/database');
const config = require('../config');

function createEvent({ name, format, region, startTime, games, maxPlayers, checkinMinutes, hostDiscordId, yuniteUrl = null }) {
  const result = run(
    `INSERT INTO events (
      name, format, region, start_time, games, max_players, checkin_minutes, yunite_url, host_discord_id,
      signup_channel_id, checkin_channel_id, leaderboard_channel_id, lobby_channel_id
    ) VALUES (
      :name, :format, :region, :start_time, :games, :max_players, :checkin_minutes, :yunite_url, :host_discord_id,
      :signup_channel_id, :checkin_channel_id, :leaderboard_channel_id, :lobby_channel_id
    )`,
    {
      name,
      format,
      region,
      start_time: startTime,
      games,
      max_players: maxPlayers,
      checkin_minutes: checkinMinutes,
      yunite_url: yuniteUrl,
      host_discord_id: hostDiscordId,
      signup_channel_id: config.channels.signup,
      checkin_channel_id: config.channels.checkin,
      leaderboard_channel_id: config.channels.leaderboard,
      lobby_channel_id: config.channels.lobby
    }
  );

  return getEventById(Number(result.lastInsertRowid));
}

function getEventById(id) {
  return get(`SELECT * FROM events WHERE id = :id`, { id });
}

function getLatestActiveEvent() {
  return get(
    `SELECT * FROM events
     WHERE status IN ('scheduled', 'checkin_open', 'in_progress')
     ORDER BY datetime(start_time) ASC, id ASC
     LIMIT 1`
  );
}

function setMessageIds(eventId, updates) {
  const fields = [];
  const params = { id: eventId };

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = :${key}`);
    params[key] = value;
  }

  if (!fields.length) return;
  fields.push('updated_at = CURRENT_TIMESTAMP');

  run(`UPDATE events SET ${fields.join(', ')} WHERE id = :id`, params);
}

function listRegistrations(eventId) {
  return all(
    `SELECT * FROM event_registrations WHERE event_id = :event_id ORDER BY queue_position IS NOT NULL, queue_position ASC, joined_at ASC`,
    { event_id: eventId }
  );
}

function listMainPlayers(eventId) {
  return all(
    `SELECT * FROM event_registrations
     WHERE event_id = :event_id AND status IN ('registered', 'checked_in', 'confirmed')
     ORDER BY joined_at ASC`,
    { event_id: eventId }
  );
}

function listQueuedPlayers(eventId) {
  return all(
    `SELECT * FROM event_registrations
     WHERE event_id = :event_id AND status = 'queued'
     ORDER BY queue_position ASC, joined_at ASC`,
    { event_id: eventId }
  );
}

function getRegistration(eventId, discordId) {
  return get(
    `SELECT * FROM event_registrations WHERE event_id = :event_id AND discord_id = :discord_id`,
    { event_id: eventId, discord_id: discordId }
  );
}

function registerPlayer(eventId, user) {
  const event = getEventById(eventId);
  if (!event) throw new Error('Event not found.');

  const existing = getRegistration(eventId, user.id);
  if (existing) return existing;

  const mainCount = get(
    `SELECT COUNT(*) AS count FROM event_registrations
     WHERE event_id = :event_id AND status IN ('registered', 'checked_in', 'confirmed')`,
    { event_id: eventId }
  ).count;

  if (mainCount < event.max_players) {
    run(
      `INSERT INTO event_registrations (event_id, discord_id, username, status)
       VALUES (:event_id, :discord_id, :username, 'registered')`,
      { event_id: eventId, discord_id: user.id, username: user.username }
    );
  } else {
    const nextPosition = (get(
      `SELECT COALESCE(MAX(queue_position), 0) + 1 AS next_position
       FROM event_registrations WHERE event_id = :event_id AND status = 'queued'`,
      { event_id: eventId }
    )?.next_position) || 1;

    run(
      `INSERT INTO event_registrations (event_id, discord_id, username, status, queue_position)
       VALUES (:event_id, :discord_id, :username, 'queued', :queue_position)`,
      { event_id: eventId, discord_id: user.id, username: user.username, queue_position: nextPosition }
    );
  }

  return getRegistration(eventId, user.id);
}

function leaveEvent(eventId, discordId) {
  run(`DELETE FROM event_registrations WHERE event_id = :event_id AND discord_id = :discord_id`, {
    event_id: eventId,
    discord_id: discordId
  });
  normalizeQueue(eventId);
}

function setRegistrationStatus(eventId, discordId, status) {
  run(
    `UPDATE event_registrations
     SET status = :status,
         checked_in_at = CASE WHEN :status = 'checked_in' THEN CURRENT_TIMESTAMP ELSE checked_in_at END
     WHERE event_id = :event_id AND discord_id = :discord_id`,
    { event_id: eventId, discord_id: discordId, status }
  );
}

function normalizeQueue(eventId) {
  const queue = listQueuedPlayers(eventId);
  queue.forEach((entry, index) => {
    run(
      `UPDATE event_registrations SET queue_position = :position WHERE id = :id`,
      { position: index + 1, id: entry.id }
    );
  });
}

function promoteQueueIfNeeded(eventId) {
  const event = getEventById(eventId);
  if (!event) return [];

  const promoted = [];
  const mainCount = get(
    `SELECT COUNT(*) AS count FROM event_registrations
     WHERE event_id = :event_id AND status IN ('registered', 'checked_in', 'confirmed')`,
    { event_id: eventId }
  ).count;

  let currentCount = mainCount;
  const queue = listQueuedPlayers(eventId);

  for (const queued of queue) {
    if (currentCount >= event.max_players) break;
    run(
      `UPDATE event_registrations
       SET status = 'registered', queue_position = NULL
       WHERE id = :id`,
      { id: queued.id }
    );
    promoted.push(queued);
    currentCount += 1;
  }

  normalizeQueue(eventId);
  return promoted;
}

function updateEventStatus(eventId, status) {
  run(
    `UPDATE events SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id`,
    { id: eventId, status }
  );
}

function openCheckin(eventId) {
  run(
    `UPDATE events
     SET status = 'checkin_open', checkin_opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = :id`,
    { id: eventId }
  );
}

function closeCheckin(eventId) {
  run(
    `UPDATE events
     SET status = 'in_progress', checkin_closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = :id`,
    { id: eventId }
  );
}

function markNoShows(eventId) {
  const noShows = all(
    `SELECT * FROM event_registrations
     WHERE event_id = :event_id AND status = 'registered'`,
    { event_id: eventId }
  );

  run(
    `UPDATE event_registrations
     SET status = 'no_show'
     WHERE event_id = :event_id AND status = 'registered'`,
    { event_id: eventId }
  );

  return noShows;
}

function addPenalty({ eventId = null, user, type, reason, severity = 1, issuedBy }) {
  run(
    `INSERT INTO penalties (event_id, discord_id, username, penalty_type, reason, severity, issued_by)
     VALUES (:event_id, :discord_id, :username, :penalty_type, :reason, :severity, :issued_by)`,
    {
      event_id: eventId,
      discord_id: user.id,
      username: user.username,
      penalty_type: type,
      reason,
      severity,
      issued_by: issuedBy
    }
  );
}

function getUpcomingEvents() {
  return all(`SELECT * FROM events WHERE status IN ('scheduled', 'checkin_open') ORDER BY datetime(start_time) ASC`);
}

module.exports = {
  createEvent,
  getEventById,
  getLatestActiveEvent,
  setMessageIds,
  listRegistrations,
  listMainPlayers,
  listQueuedPlayers,
  getRegistration,
  registerPlayer,
  leaveEvent,
  setRegistrationStatus,
  normalizeQueue,
  promoteQueueIfNeeded,
  updateEventStatus,
  openCheckin,
  closeCheckin,
  markNoShows,
  addPenalty,
  getUpcomingEvents
};
