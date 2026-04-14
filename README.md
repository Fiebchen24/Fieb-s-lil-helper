# Fiebs Lil Helper Bot

A combined Discord bot for **hosting**, **giveaways**, **invite tracking**, and **season management**.

It is built for a very simple player flow:
- Join
- Check In

Results stay on **Yunite**.

## What this build includes

### Hosting
- Slash command event creation
- Join / Leave / Queue buttons
- Automatic check-in open / close scheduler
- Auto no-show penalties at check-in close
- Queue promotion after no-shows or leaves
- Manual lobby code posting
- Yunite leaderboard link support per event

### Giveaway
- Create giveaways
- Credit verified giveaway entries manually
- Credit all tracked pending invites after proof is checked
- View giveaway status
- Export a weighted wheelspin text file
- Close giveaways

### Upgrade pack included
- Automatic invite tracking for new joins
- Season points commands
- Season leaderboard command
- Trusted player role sync from reputation
- Player stats with season points and invite stats

## Requirements

- Node.js 22.13+
- Discord bot token
- Discord bot permissions:
  - Send Messages
  - Read Message History
  - Use Application Commands
  - Manage Roles
  - Manage Server (needed for invite tracking)
  - Create Instant Invite / View Channels where needed

## Files included for GitHub + Render

- `.gitignore`
- `.env.example`
- `render.yaml`
- clean `README.md`

This project is set up so you can push it straight to GitHub and deploy it on **Render as a Background Worker**.

## Setup locally

1. Copy `.env.example` to `.env`
2. Fill in your bot token, client ID, guild ID, channels, and roles
3. Install dependencies:

```bash
npm install
```

4. Register guild commands:

```bash
npm run register
```

5. Start the bot:

```bash
npm start
```

## Render deployment

### Option A: easiest
Use the included `render.yaml` with a Render Blueprint.

### Option B: manual worker setup
Create a **Background Worker** in Render and use:

- Build Command: `npm install`
- Start Command: `npm start`

Then add all variables from `.env.example` into Render.

After the first deploy, run command registration once locally or through a Render shell:

```bash
npm run register
```

## Commands

### Hosting staff
- `/event-create`
- `/event-post-lobby`
- `/event-end`
- `/penalty-add`
- `/season-award`

### Giveaway staff
- `/giveaway-create`
- `/giveaway-credit`
- `/giveaway-credit-pending`
- `/giveaway-export`
- `/giveaway-close`

### Everyone
- `/event-info`
- `/my-stats`
- `/giveaway-status`
- `/invite-stats`
- `/season-leaderboard`

## Invite tracking notes

Invite tracking is automatic for new members **if the bot has Manage Server permission**.

Flow:
1. someone joins through an invite
2. the bot tracks who invited them
3. that invite stays marked as pending
4. once creator code proof is verified, staff use `/giveaway-credit-pending`
5. the pending invites for that player are converted into giveaway entries

This keeps giveaways simple for players and still gives staff control.

## Suggested channels

### Public
- `#announcements`
- `#event-signups`
- `#check-in`
- `#lobby-info`
- `#leaderboard`
- `#giveaway`
- `#creator-code-proof`
- `#invites`

### Staff
- `#host-panel`
- `#staff-log`
- `#penalties`

## Suggested roles

- Owner
- Admin
- Senior Host
- Host
- Moderator
- Registered
- Checked In
- Queued
- Event Banned
- Trusted Player
