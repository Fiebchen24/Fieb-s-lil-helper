const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '../../data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'fiebs-helper.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,
  total_events INTEGER NOT NULL DEFAULT 0,
  total_no_shows INTEGER NOT NULL DEFAULT 0,
  total_penalties INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  region TEXT NOT NULL,
  start_time TEXT NOT NULL,
  games INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  checkin_minutes INTEGER NOT NULL,
  yunite_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  signup_message_id TEXT,
  signup_channel_id TEXT,
  checkin_message_id TEXT,
  checkin_channel_id TEXT,
  leaderboard_message_id TEXT,
  leaderboard_channel_id TEXT,
  lobby_message_id TEXT,
  lobby_channel_id TEXT,
  host_panel_message_id TEXT,
  host_discord_id TEXT NOT NULL,
  checkin_opened_at TEXT,
  checkin_closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  discord_id TEXT NOT NULL,
  username TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registered',
  queue_position INTEGER,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checked_in_at TEXT,
  UNIQUE(event_id, discord_id),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  discord_id TEXT NOT NULL,
  username TEXT NOT NULL,
  penalty_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  issued_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS host_stats (
  discord_id TEXT PRIMARY KEY,
  events_hosted INTEGER NOT NULL DEFAULT 0,
  penalties_issued INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS giveaways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  prize TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_by_discord_id TEXT NOT NULL,
  created_by_username TEXT NOT NULL,
  winner_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS giveaway_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  giveaway_id INTEGER NOT NULL,
  discord_id TEXT NOT NULL,
  username TEXT NOT NULL,
  entries INTEGER NOT NULL DEFAULT 1,
  invites_count INTEGER NOT NULL DEFAULT 1,
  proof_note TEXT,
  verified_by_discord_id TEXT NOT NULL,
  verified_by_username TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invite_joins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  inviter_discord_id TEXT NOT NULL,
  inviter_username TEXT NOT NULL,
  invited_discord_id TEXT NOT NULL UNIQUE,
  invited_username TEXT NOT NULL,
  invite_code TEXT,
  reward_processed INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS season_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  discord_id TEXT NOT NULL,
  username TEXT NOT NULL,
  points INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  note TEXT,
  awarded_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE SET NULL
);
`);

const eventColumns = allColumns('events');
if (!eventColumns.includes('host_panel_message_id')) {
  db.exec(`ALTER TABLE events ADD COLUMN host_panel_message_id TEXT`);
}

function allColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map((row) => row.name);
}

function run(sql, params = {}) {
  return db.prepare(sql).run(params);
}

function get(sql, params = {}) {
  return db.prepare(sql).get(params);
}

function all(sql, params = {}) {
  return db.prepare(sql).all(params);
}

module.exports = {
  db,
  run,
  get,
  all
};
