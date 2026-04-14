const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const eventService = require('../services/eventService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event-info')
    .setDescription('Show info for the current event or a specific event.')
    .addIntegerOption((option) => option.setName('event_id').setDescription('Optional event ID')),

  async execute(interaction) {
    const eventId = interaction.options.getInteger('event_id') || eventService.getLatestActiveEvent()?.id;
    const event = eventService.getEventById(eventId);
    if (!event) {
      return interaction.reply({ content: 'No event found.', ephemeral: true });
    }

    const registrations = eventService.listRegistrations(event.id);
    const main = registrations.filter((x) => ['registered', 'checked_in', 'confirmed'].includes(x.status)).length;
    const checkedIn = registrations.filter((x) => x.status === 'checked_in').length;
    const queue = registrations.filter((x) => x.status === 'queued').length;

    const embed = new EmbedBuilder()
      .setTitle(`Event Info • ${event.name}`)
      .setDescription([
        `**ID:** ${event.id}`,
        `**Format:** ${event.format}`,
        `**Status:** ${event.status}`,
        `**Start:** <t:${Math.floor(new Date(event.start_time).getTime() / 1000)}:F>`,
        `**Games:** ${event.games}`,
        `**Main Slots:** ${main}/${event.max_players}`,
        `**Checked In:** ${checkedIn}`,
        `**Queue:** ${queue}`
      ].join('\n'));

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
