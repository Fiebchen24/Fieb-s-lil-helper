const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const seasonService = require('../services/seasonService');
const userService = require('../services/userService');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('season-award')
    .setDescription('Award season points from Yunite standings or manual review.')
    .addUserOption((option) => option.setName('player').setDescription('Player to award').setRequired(true))
    .addIntegerOption((option) => option.setName('points').setDescription('Points to add').setRequired(true).setMinValue(1).setMaxValue(500))
    .addStringOption((option) => option.setName('note').setDescription('Optional note, e.g. Yunite placement or event name'))
    .addIntegerOption((option) => option.setName('event_id').setDescription('Optional related event ID'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const player = interaction.options.getUser('player', true);
    const points = interaction.options.getInteger('points', true);
    const note = interaction.options.getString('note') || 'Manual award';
    userService.ensureUser(player);

    seasonService.addPoints({
      eventId: interaction.options.getInteger('event_id') || null,
      user: player,
      points,
      source: 'manual',
      note,
      awardedBy: interaction.user.username
    });

    const member = await interaction.guild.members.fetch(player.id).catch(() => null);
    if (member) {
      await userService.applyReputationDelta(member, 1);
    } else {
      userService.incrementField(player.id, 'reputation', 1);
    }

    await staffLog(client, `🏆 Season points awarded: <@${player.id}> received **${points}** points by <@${interaction.user.id}>. Note: ${note}`);
    return interaction.reply({ content: `Awarded **${points}** season points to **${player.username}**.`, ephemeral: true });
  }
};
