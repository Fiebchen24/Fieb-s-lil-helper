const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const seasonService = require('../services/seasonService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('season-leaderboard')
    .setDescription('Show the current season leaderboard.')
    .addIntegerOption((option) => option.setName('limit').setDescription('How many players to show').setMinValue(3).setMaxValue(25)),

  async execute(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    const rows = seasonService.getLeaderboard(limit);
    if (!rows.length) {
      return interaction.reply({ content: 'No season points have been recorded yet.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Season Leaderboard')
      .setDescription(rows.map((row, index) => `**${index + 1}.** ${row.username} — ${row.total_points} pts`).join('\n'));

    return interaction.reply({ embeds: [embed] });
  }
};
