const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const giveawayService = require('../services/giveawayService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-status')
    .setDescription('Show the current or selected giveaway status.')
    .addIntegerOption((option) => option.setName('giveaway_id').setDescription('Optional giveaway ID')),

  async execute(interaction) {
    const giveawayId = interaction.options.getInteger('giveaway_id') || giveawayService.getLatestOpenGiveaway()?.id;
    const giveaway = giveawayService.getGiveawayById(giveawayId);
    if (!giveaway) {
      return interaction.reply({ content: 'No giveaway found.', ephemeral: true });
    }

    const summary = giveawayService.getSummary(giveaway.id);
    const top = giveawayService.getParticipantBreakdown(giveaway.id).slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle(`Giveaway Status • ${giveaway.title}`)
      .setDescription([
        `**ID:** ${giveaway.id}`,
        `**Prize:** ${giveaway.prize}`,
        `**Status:** ${giveaway.status}`,
        `**Winners:** ${giveaway.winner_count}`,
        `**Participants:** ${summary.participant_count}`,
        `**Total Entries:** ${summary.total_entries}`,
        `**Total Verified Invites:** ${summary.total_invites}`,
        giveaway.notes ? `**Notes:** ${giveaway.notes}` : null
      ].filter(Boolean).join('\n'));

    if (top.length) {
      embed.addFields({
        name: 'Top Entries',
        value: top.map((person, index) => `${index + 1}. **${person.username}** — ${person.entries} entries`).join('\n')
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
