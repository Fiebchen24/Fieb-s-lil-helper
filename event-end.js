const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const eventService = require('../services/eventService');
const runtimeService = require('../services/runtimeService');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-end')
    .setDescription('End the current event.')
    .addIntegerOption((option) => option.setName('event_id').setDescription('Optional event ID'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const eventId = interaction.options.getInteger('event_id') || eventService.getLatestActiveEvent()?.id;
    const event = eventService.getEventById(eventId);
    if (!event) {
      return interaction.reply({ content: 'No active event found.', ephemeral: true });
    }

    eventService.updateEventStatus(event.id, 'ended');
    runtimeService.clearLobbyCode(event.id);
    await staffLog(client, `🏁 Event ended: **${event.name}** (ID ${event.id}) by <@${interaction.user.id}>.`);
    return interaction.reply({ content: `Event **${event.name}** is now marked as ended.`, ephemeral: true });
  }
};
