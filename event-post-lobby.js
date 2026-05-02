const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const eventService = require('../services/eventService');
const embedService = require('../services/embedService');
const runtimeService = require('../services/runtimeService');
const config = require('../config');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-post-lobby')
    .setDescription('Post the lobby code for the current event.')
    .addStringOption((option) => option.setName('code').setDescription('Custom matchmaking code').setRequired(true))
    .addIntegerOption((option) => option.setName('event_id').setDescription('Optional event ID'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const eventId = interaction.options.getInteger('event_id') || eventService.getLatestActiveEvent()?.id;
    const event = eventService.getEventById(eventId);
    if (!event) {
      return interaction.reply({ content: 'No active event found.', ephemeral: true });
    }

    const code = interaction.options.getString('code', true).trim();
    runtimeService.setLobbyCode(event.id, code);

    const lobbyChannel = await client.channels.fetch(config.channels.lobby);
    const message = await lobbyChannel.send({ embeds: [embedService.lobbyEmbed(event, code)] });
    eventService.setMessageIds(event.id, { lobby_message_id: message.id });

    await staffLog(client, `🎮 Lobby code posted for event **${event.name}** (ID ${event.id}) by <@${interaction.user.id}>.`);
    return interaction.reply({ content: `Lobby posted for **${event.name}**.`, ephemeral: true });
  }
};
