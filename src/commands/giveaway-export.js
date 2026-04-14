const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayService = require('../services/giveawayService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-export')
    .setDescription('Export the weighted wheel list for the current or selected giveaway.')
    .addIntegerOption((option) => option.setName('giveaway_id').setDescription('Optional giveaway ID'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const giveawayId = interaction.options.getInteger('giveaway_id') || giveawayService.getLatestOpenGiveaway()?.id;
    const giveaway = giveawayService.getGiveawayById(giveawayId);
    if (!giveaway) {
      return interaction.reply({ content: 'No giveaway found.', ephemeral: true });
    }

    const lines = giveawayService.buildWheelLines(giveaway.id);
    if (!lines.length) {
      return interaction.reply({ content: 'This giveaway has no entries yet.', ephemeral: true });
    }

    const content = lines.join('\n');
    const safeTitle = giveaway.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'giveaway';
    const attachment = new AttachmentBuilder(Buffer.from(content, 'utf8'), { name: `${safeTitle}-wheelspin.txt` });

    return interaction.reply({
      content: `Export ready for **${giveaway.title}**. Total weighted lines: **${lines.length}**.`,
      files: [attachment],
      ephemeral: true
    });
  }
};
