const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');
const eventService = require('./services/eventService');
const userService = require('./services/userService');
const embedService = require('./services/embedService');
const inviteTrackerService = require('./services/inviteTrackerService');
const { isStaff } = require('./utils/permissions');
const { staffLog, penaltyLog } = require('./services/logService');
const runtimeService = require('./services/runtimeService');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildInvites],
  partials: [Partials.Channel]
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(config.guildId);
  if (guild) {
    await inviteTrackerService.seedGuildInvites(guild);
  }
  startScheduler();
});

client.on('guildMemberAdd', async (member) => {
  const usedInvite = await inviteTrackerService.handleMemberJoin(member);
  if (!usedInvite) return;
  await staffLog(client, `📨 Invite tracked: <@${usedInvite.inviter.id}> invited <@${member.id}> using code \`${usedInvite.inviteCode || 'unknown'}\`.`);
});

client.on('inviteCreate', async (invite) => {
  if (invite.guild) {
    await inviteTrackerService.refreshGuildInvites(invite.guild);
  }
});

client.on('inviteDelete', async (invite) => {
  if (invite.guild) {
    await inviteTrackerService.refreshGuildInvites(invite.guild);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
      return;
    }

    if (interaction.isButton()) {
      await handleButton(interaction);
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Something went wrong while processing that action.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: 'Something went wrong while processing that action.', ephemeral: true }).catch(() => {});
    }
  }
});

async function handleButton(interaction) {
  const [action, arg1] = interaction.customId.split(':');

  if (action === 'event_join' || action === 'event_queue') {
    const event = eventService.getEventById(Number(arg1));
    if (!event || event.status === 'ended' || event.status === 'cancelled') {
      return interaction.reply({ content: 'This event is no longer open.', ephemeral: true });
    }

    if (config.roles.banned && interaction.member.roles.cache.has(config.roles.banned)) {
      return interaction.reply({ content: 'You are currently banned from events.', ephemeral: true });
    }

    userService.ensureUser(interaction.user);
    let registration = eventService.getRegistration(event.id, interaction.user.id);
    if (!registration) {
      registration = eventService.registerPlayer(event.id, interaction.user);
      userService.incrementField(interaction.user.id, 'total_events', 1);
    } else if (action === 'event_queue' && registration.status !== 'queued') {
      return interaction.reply({ content: 'You already have a main slot in this event.', ephemeral: true });
    }

    if (registration.status === 'queued') {
      await setRole(interaction.member, config.roles.queued, true);
      await setRole(interaction.member, config.roles.registered, false);
      await refreshEventMessages(event.id);
      return interaction.reply({ content: `You joined the queue for **${event.name}**.`, ephemeral: true });
    }

    await setRole(interaction.member, config.roles.registered, true);
    await refreshEventMessages(event.id);
    return interaction.reply({ content: `You joined **${event.name}**.`, ephemeral: true });
  }

  if (action === 'event_leave') {
    const event = eventService.getEventById(Number(arg1));
    if (!event) {
      return interaction.reply({ content: 'Event not found.', ephemeral: true });
    }

    const registration = eventService.getRegistration(event.id, interaction.user.id);
    if (!registration) {
      return interaction.reply({ content: 'You are not registered for this event.', ephemeral: true });
    }

    eventService.leaveEvent(event.id, interaction.user.id);
    const promoted = eventService.promoteQueueIfNeeded(event.id);

    await setRole(interaction.member, config.roles.registered, false);
    await setRole(interaction.member, config.roles.checkedIn, false);
    await setRole(interaction.member, config.roles.queued, false);
    await refreshEventMessages(event.id);

    for (const promotedUser of promoted) {
      const guildMember = await interaction.guild.members.fetch(promotedUser.discord_id).catch(() => null);
      if (guildMember) {
        await setRole(guildMember, config.roles.registered, true);
        await setRole(guildMember, config.roles.queued, false);
      }
    }

    return interaction.reply({ content: `You left **${event.name}**.`, ephemeral: true });
  }

  if (action === 'event_checkin') {
    const event = eventService.getEventById(Number(arg1));
    if (!event) {
      return interaction.reply({ content: 'Event not found.', ephemeral: true });
    }
    if (event.status !== 'checkin_open') {
      return interaction.reply({ content: 'Check-in is not open right now.', ephemeral: true });
    }

    const registration = eventService.getRegistration(event.id, interaction.user.id);
    if (!registration || !['registered', 'checked_in'].includes(registration.status)) {
      return interaction.reply({ content: 'You need a main slot before you can check in.', ephemeral: true });
    }

    eventService.setRegistrationStatus(event.id, interaction.user.id, 'checked_in');
    await setRole(interaction.member, config.roles.checkedIn, true);
    await userService.applyReputationDelta(interaction.member, 1);
    await refreshEventMessages(event.id);
    return interaction.reply({ content: `You are checked in for **${event.name}**.`, ephemeral: true });
  }

  if (action.startsWith('host_')) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: 'Staff only.', ephemeral: true });
    }

    const eventId = Number(arg1);
    const event = eventService.getEventById(eventId);
    if (!event) {
      return interaction.reply({ content: 'Event not found.', ephemeral: true });
    }

    if (action === 'host_open_checkin') {
      await openCheckinForEvent(event, interaction.guild);
      return interaction.reply({ content: `Check-in opened for **${event.name}**.`, ephemeral: true });
    }

    if (action === 'host_close_checkin') {
      await closeCheckinForEvent(event, interaction.guild);
      return interaction.reply({ content: `Check-in closed for **${event.name}**.`, ephemeral: true });
    }

    if (action === 'host_post_lobby') {
      const code = runtimeService.getLobbyCode(event.id);
      if (!code) {
        return interaction.reply({ content: 'No lobby code stored yet. Use `/event-post-lobby code:...` first.', ephemeral: true });
      }
      const lobbyChannel = await client.channels.fetch(config.channels.lobby);
      await lobbyChannel.send({ embeds: [embedService.lobbyEmbed(event, code)] });
      return interaction.reply({ content: 'Lobby info posted.', ephemeral: true });
    }

    if (action === 'host_refresh_board') {
      await refreshLeaderboard(event.id);
      return interaction.reply({ content: 'Leaderboard message refreshed.', ephemeral: true });
    }

    if (action === 'host_end_event') {
      eventService.updateEventStatus(event.id, 'ended');
      await refreshHostPanel(event.id);
      return interaction.reply({ content: `Event **${event.name}** has been ended.`, ephemeral: true });
    }
  }
}

async function setRole(member, roleId, shouldHave) {
  if (!roleId) return;
  const hasRole = member.roles.cache.has(roleId);
  if (shouldHave && !hasRole) {
    await member.roles.add(roleId).catch(() => {});
  }
  if (!shouldHave && hasRole) {
    await member.roles.remove(roleId).catch(() => {});
  }
}

async function refreshEventMessages(eventId) {
  const event = eventService.getEventById(eventId);
  if (!event) return;

  const registrations = eventService.listRegistrations(eventId);
  const main = registrations.filter((entry) => ['registered', 'checked_in', 'confirmed'].includes(entry.status)).length;
  const queue = registrations.filter((entry) => entry.status === 'queued').length;
  const checkedIn = registrations.filter((entry) => entry.status === 'checked_in').length;

  const signupChannel = await client.channels.fetch(event.signup_channel_id).catch(() => null);
  const checkinChannel = await client.channels.fetch(event.checkin_channel_id).catch(() => null);

  if (signupChannel && event.signup_message_id) {
    const signupMessage = await signupChannel.messages.fetch(event.signup_message_id).catch(() => null);
    if (signupMessage) {
      await signupMessage.edit({
        embeds: [embedService.eventEmbed(event, { main, queue })],
        components: [embedService.eventButtons(event.id)]
      }).catch(() => {});
    }
  }

  if (checkinChannel && event.checkin_message_id) {
    const checkinMessage = await checkinChannel.messages.fetch(event.checkin_message_id).catch(() => null);
    if (checkinMessage) {
      await checkinMessage.edit({
        embeds: [embedService.checkinEmbed(event, { checkedIn })],
        components: [embedService.checkinButtons(event.id)]
      }).catch(() => {});
    }
  }

  await refreshHostPanel(eventId);
}

async function refreshLeaderboard(eventId) {
  const event = eventService.getEventById(eventId);
  if (!event) return;
  const leaderboardChannel = await client.channels.fetch(event.leaderboard_channel_id).catch(() => null);
  if (!leaderboardChannel || !event.leaderboard_message_id) return;
  const leaderboardMessage = await leaderboardChannel.messages.fetch(event.leaderboard_message_id).catch(() => null);
  if (!leaderboardMessage) return;

  await leaderboardMessage.edit({ embeds: [embedService.leaderboardEmbed(event)] }).catch(() => {});
}

async function refreshHostPanel(eventId) {
  const event = eventService.getEventById(eventId);
  if (!event) return;
  const hostPanelChannel = await client.channels.fetch(config.channels.hostPanel).catch(() => null);
  if (!hostPanelChannel || !event.host_panel_message_id) return;
  const hostPanelMessage = await hostPanelChannel.messages.fetch(event.host_panel_message_id).catch(() => null);
  if (!hostPanelMessage) return;

  await hostPanelMessage.edit({
    embeds: [embedService.hostPanelEmbed(event)],
    components: embedService.hostPanelButtons(event.id)
  }).catch(() => {});
}

async function openCheckinForEvent(event, guild) {
  if (event.status === 'checkin_open') return;
  eventService.openCheckin(event.id);
  await refreshEventMessages(event.id);
  await staffLog(client, `✅ Check-in opened for **${event.name}** (ID ${event.id}).`);
}

async function closeCheckinForEvent(event, guild) {
  if (event.status === 'in_progress' || event.status === 'ended') return;

  const noShows = eventService.markNoShows(event.id);
  for (const entry of noShows) {
    const user = await client.users.fetch(entry.discord_id).catch(() => null);
    if (user) {
      userService.ensureUser(user);
      eventService.addPenalty({
        eventId: event.id,
        user,
        type: 'No Show',
        reason: `Did not check in for event ${event.name}`,
        severity: 1,
        issuedBy: 'System'
      });
      userService.incrementField(user.id, 'total_no_shows', 1);
      userService.incrementField(user.id, 'total_penalties', 1);
      userService.incrementField(user.id, 'reputation', -2);
      await penaltyLog(client, `⚠️ No-show penalty added to <@${user.id}> for **${event.name}**.`);
    }

    const member = await guild.members.fetch(entry.discord_id).catch(() => null);
    if (member) {
      await setRole(member, config.roles.registered, false);
      await setRole(member, config.roles.checkedIn, false);
      await userService.syncTrustedRole(member);
    }
  }

  eventService.closeCheckin(event.id);
  const promoted = eventService.promoteQueueIfNeeded(event.id);

  for (const queued of promoted) {
    const member = await guild.members.fetch(queued.discord_id).catch(() => null);
    if (member) {
      await setRole(member, config.roles.registered, true);
      await setRole(member, config.roles.queued, false);
    }
  }

  await refreshEventMessages(event.id);
  await staffLog(client, `🚪 Check-in closed for **${event.name}** (ID ${event.id}). No-shows: ${noShows.length}. Promoted from queue: ${promoted.length}.`);
}

function startScheduler() {
  setInterval(async () => {
    const upcoming = eventService.getUpcomingEvents();
    const now = Date.now();

    for (const event of upcoming) {
      const start = new Date(event.start_time).getTime();
      const checkinOpenAt = start - (event.checkin_minutes * 60 * 1000);

      if (event.status === 'scheduled' && now >= checkinOpenAt && now < start) {
        const guild = client.guilds.cache.get(config.guildId);
        if (guild) {
          await openCheckinForEvent(event, guild);
        }
      }

      if (event.status === 'checkin_open' && now >= start) {
        const guild = client.guilds.cache.get(config.guildId);
        if (guild) {
          await closeCheckinForEvent(event, guild);
        }
      }
    }
  }, config.schedulerIntervalMs);
}

client.login(config.token);
