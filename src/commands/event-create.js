const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const eventService = require('../services/eventService');
const userService = require('../services/userService');
const embedService = require('../services/embedService');
const config = require('../config');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-create')
    .setDescription('Create a new Butter event.')
    .addStringOption((option) => option.setName('name').setDescription('Event name').setRequired(true))
    .addStringOption((option) =>
      option.setName('format').setDescription('Event format').setRequired(true)
        .addChoices(
          { name: 'Solo', value: 'Solo' },
          { name: 'Duo', value: 'Duo' },
          { name: 'Trio', value: 'Trio' },
          { name: 'Squad', value: 'Squad' }
        )
    )
    .addStringOption((option) => option.setName('start_time').setDescription('ISO time, e.g. 2026-04-07T20:00:00+02:00').setRequired(true))
    .addIntegerOption((option) => option.setName('games').setDescription('Number of games').setRequired(true).setMinValue(1).setMaxValue(20))
    .addIntegerOption((option) => option.setName('max_players').setDescription('Max main slots').setRequired(true).setMinValue(2).setMaxValue(200))
    .addIntegerOption((option) => option.setName('checkin_minutes').setDescription('How many minutes before start check-in opens').setRequired(true).setMinValue(5).setMaxValue(120))
    .addStringOption((option) => option.setName('yunite_url').setDescription('Optional Yunite tournament/leaderboard link').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const startTime = interaction.options.getString('start_time', true);
    const parsedTime = new Date(startTime);

    if (Number.isNaN(parsedTime.getTime())) {
      return interaction.reply({ content: 'Invalid `start_time`. Use a full ISO date like `2026-04-07T20:00:00+02:00`.', ephemeral: true });
    }

    const event = eventService.createEvent({
      name: interaction.options.getString('name', true),
      format: interaction.options.getString('format', true),
      region: 'EU',
      startTime: parsedTime.toISOString(),
      games: interaction.options.getInteger('games', true),
      maxPlayers: interaction.options.getInteger('max_players', true),
      checkinMinutes: interaction.options.getInteger('checkin_minutes', true),
      hostDiscordId: interaction.user.id,
      yuniteUrl: interaction.options.getString('yunite_url') || null
    });

    userService.ensureUser(interaction.user);

    const signupChannel = await client.channels.fetch(config.channels.signup);
    const checkinChannel = await client.channels.fetch(config.channels.checkin);
    const leaderboardChannel = await client.channels.fetch(config.channels.leaderboard);
    const hostPanelChannel = await client.channels.fetch(config.channels.hostPanel);

    const signupMessage = await signupChannel.send({
      embeds: [embedService.eventEmbed(event, { main: 0, queue: 0 })],
      components: [embedService.eventButtons(event.id)]
    });

    const checkinMessage = await checkinChannel.send({
      embeds: [embedService.checkinEmbed(event, { checkedIn: 0 })],
      components: [embedService.checkinButtons(event.id)]
    });

    const leaderboardMessage = await leaderboardChannel.send({
      embeds: [embedService.leaderboardEmbed(event)]
    });

    const hostPanel = await hostPanelChannel.send({
      embeds: [embedService.hostPanelEmbed(event)],
      components: embedService.hostPanelButtons(event.id)
    });

    eventService.setMessageIds(event.id, {
      signup_message_id: signupMessage.id,
      checkin_message_id: checkinMessage.id,
      leaderboard_message_id: leaderboardMessage.id,
      host_panel_message_id: hostPanel.id
    });

    await staffLog(client, `📅 Event created: **${event.name}** (ID ${event.id}) by <@${interaction.user.id}>.`);

    return interaction.reply({
      content: `Event created successfully. Event ID: **${event.id}**.`,
      ephemeral: true
    });
  }
};
