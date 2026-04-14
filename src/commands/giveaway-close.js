const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayService = require('../services/giveawayService');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-close')
    .setDescription('Close a giveaway so no more entries are added.')
    .addIntegerOption((option) => option.setName('giveaway_id').setDescription('Optional giveaway ID'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const giveawayId = interaction.options.getInteger('giveaway_id') || giveawayService.getLatestOpenGiveaway()?.id;
    const giveaway = giveawayService.getGiveawayById(giveawayId);
    if (!giveaway) {
      return interaction.reply({ content: 'No giveaway found.', ephemeral: true });
    }
    if (giveaway.status !== 'open') {
      return interaction.reply({ content: 'That giveaway is already closed.', ephemeral: true });
    }

    giveawayService.closeGiveaway(giveaway.id);
    await staffLog(client, `🔒 Giveaway closed: **${giveaway.title}** (ID ${giveaway.id}) by <@${interaction.user.id}>.`);
    return interaction.reply({ content: `Giveaway **${giveaway.title}** is now closed.`, ephemeral: true });
  }
};
