const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const eventService = require('../services/eventService');
const userService = require('../services/userService');
const { penaltyLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('penalty-add')
    .setDescription('Add a manual penalty to a player.')
    .addUserOption((option) => option.setName('player').setDescription('Target player').setRequired(true))
    .addStringOption((option) => option.setName('type').setDescription('Penalty type').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason').setRequired(true))
    .addIntegerOption((option) => option.setName('severity').setDescription('Severity').setMinValue(1).setMaxValue(5))
    .addIntegerOption((option) => option.setName('event_id').setDescription('Optional event ID'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const player = interaction.options.getUser('player', true);
    userService.ensureUser(player);

    eventService.addPenalty({
      eventId: interaction.options.getInteger('event_id') || null,
      user: player,
      type: interaction.options.getString('type', true),
      reason: interaction.options.getString('reason', true),
      severity: interaction.options.getInteger('severity') || 1,
      issuedBy: interaction.user.username
    });
    userService.incrementField(player.id, 'total_penalties', 1);
    userService.incrementField(player.id, 'reputation', -2);

    await penaltyLog(client, `⚠️ Manual penalty added to <@${player.id}> by <@${interaction.user.id}> — **${interaction.options.getString('type', true)}**: ${interaction.options.getString('reason', true)}`);
    return interaction.reply({ content: `Penalty added to ${player.username}.`, ephemeral: true });
  }
};
