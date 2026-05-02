const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const giveawayService = require('../services/giveawayService');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-create')
    .setDescription('Create a giveaway for verified invite + creator code entries.')
    .addStringOption((option) => option.setName('title').setDescription('Giveaway title').setRequired(true))
    .addStringOption((option) => option.setName('prize').setDescription('Prize').setRequired(true))
    .addIntegerOption((option) => option.setName('winner_count').setDescription('How many winners').setMinValue(1).setMaxValue(10))
    .addStringOption((option) => option.setName('notes').setDescription('Optional rules or notes'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const giveaway = giveawayService.createGiveaway({
      title: interaction.options.getString('title', true),
      prize: interaction.options.getString('prize', true),
      winnerCount: interaction.options.getInteger('winner_count') || 1,
      notes: interaction.options.getString('notes') || null,
      createdBy: interaction.user
    });

    const embed = new EmbedBuilder()
      .setTitle('Giveaway Created')
      .setDescription([
        `**ID:** ${giveaway.id}`,
        `**Title:** ${giveaway.title}`,
        `**Prize:** ${giveaway.prize}`,
        `**Winners:** ${giveaway.winner_count}`,
        `**Status:** ${giveaway.status}`,
        giveaway.notes ? `**Notes:** ${giveaway.notes}` : null,
        '',
        'Use `/giveaway-credit` to verify entries after invite + creator code proof is checked.'
      ].filter(Boolean).join('\n'));

    await staffLog(client, `🎁 Giveaway created: **${giveaway.title}** (ID ${giveaway.id}) by <@${interaction.user.id}>.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
