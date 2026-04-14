const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const inviteService = require('../services/inviteService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite-stats')
    .setDescription('Show your tracked server invite stats.'),

  async execute(interaction) {
    const stats = inviteService.getInviteStats(interaction.user.id);
    const recent = inviteService.listRecentInvites(interaction.user.id, 5);

    const embed = new EmbedBuilder()
      .setTitle('Invite Stats')
      .setDescription([
        `**Total tracked invites:** ${stats.total_invites}`,
        `**Pending giveaway invites:** ${stats.pending_invites}`,
        `**Already processed:** ${stats.processed_invites}`
      ].join('\n'));

    if (recent.length) {
      embed.addFields({
        name: 'Recent joins',
        value: recent.map((entry) => `• **${entry.invited_username}** via \`${entry.invite_code || 'unknown'}\` — ${entry.reward_processed ? 'processed' : 'pending'}`).join('\n')
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
