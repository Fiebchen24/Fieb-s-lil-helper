const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const userService = require('../services/userService');
const seasonService = require('../services/seasonService');
const inviteService = require('../services/inviteService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('my-stats')
    .setDescription('View your Fiebs Lil Helper player stats.'),

  async execute(interaction) {
    const user = userService.getUser(interaction.user.id);
    if (!user) {
      return interaction.reply({ content: 'No stats yet. Join an event first.', ephemeral: true });
    }

    const seasonPoints = seasonService.getTotalPoints(interaction.user.id);
    const inviteStats = inviteService.getInviteStats(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('My Stats')
      .setDescription([
        `**Reputation:** ${user.reputation}`,
        `**Trusted status:** ${userService.isTrusted(interaction.user.id) ? 'Yes' : 'Not yet'}`,
        `**Season points:** ${seasonPoints}`,
        `**Events:** ${user.total_events}`,
        `**No Shows:** ${user.total_no_shows}`,
        `**Penalties:** ${user.total_penalties}`,
        `**Tracked invites:** ${inviteStats.total_invites}`,
        `**Pending giveaway invites:** ${inviteStats.pending_invites}`
      ].join('\n'));

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
