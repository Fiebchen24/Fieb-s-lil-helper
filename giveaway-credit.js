const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayService = require('../services/giveawayService');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-credit')
    .setDescription('Credit verified giveaway entries to a user.')
    .addUserOption((option) => option.setName('player').setDescription('Player to credit').setRequired(true))
    .addIntegerOption((option) => option.setName('invites').setDescription('How many verified invites').setRequired(true).setMinValue(1).setMaxValue(100))
    .addIntegerOption((option) => option.setName('giveaway_id').setDescription('Optional giveaway ID'))
    .addStringOption((option) => option.setName('proof_note').setDescription('Optional note, proof link, or admin note'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction, client) {
    const giveawayId = interaction.options.getInteger('giveaway_id') || giveawayService.getLatestOpenGiveaway()?.id;
    const giveaway = giveawayService.getGiveawayById(giveawayId);
    if (!giveaway) {
      return interaction.reply({ content: 'No open giveaway found.', ephemeral: true });
    }
    if (giveaway.status !== 'open') {
      return interaction.reply({ content: 'That giveaway is closed.', ephemeral: true });
    }

    const player = interaction.options.getUser('player', true);
    const invites = interaction.options.getInteger('invites', true);
    const proofNote = interaction.options.getString('proof_note') || null;

    giveawayService.addEntry({
      giveawayId: giveaway.id,
      user: player,
      invitesCount: invites,
      proofNote,
      verifiedBy: interaction.user
    });

    await staffLog(client, `🎁 Giveaway entry credited: <@${player.id}> received **${invites}** entries in giveaway **${giveaway.title}** (ID ${giveaway.id}) by <@${interaction.user.id}>.`);
    return interaction.reply({ content: `Credited **${invites}** entries to **${player.username}** in **${giveaway.title}**.`, ephemeral: true });
  }
};
