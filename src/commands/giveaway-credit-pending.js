const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayService = require('../services/giveawayService');
const inviteService = require('../services/inviteService');
const { staffLog } = require('../services/logService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway-credit-pending')
    .setDescription('Credit all tracked pending invites for a player after creator code proof is verified.')
    .addUserOption((option) => option.setName('player').setDescription('Player to credit').setRequired(true))
    .addIntegerOption((option) => option.setName('giveaway_id').setDescription('Optional giveaway ID'))
    .addStringOption((option) => option.setName('proof_note').setDescription('Optional proof note or admin note'))
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
    const pendingInvites = inviteService.getPendingInviteCount(player.id);
    if (pendingInvites < 1) {
      return interaction.reply({ content: 'This player has no pending tracked invites to credit.', ephemeral: true });
    }

    const proofNote = interaction.options.getString('proof_note') || null;

    giveawayService.addEntry({
      giveawayId: giveaway.id,
      user: player,
      invitesCount: pendingInvites,
      proofNote,
      verifiedBy: interaction.user
    });
    inviteService.markPendingInvitesProcessed(player.id);

    await staffLog(client, `🎁 Auto giveaway credit: <@${player.id}> received **${pendingInvites}** tracked entries in giveaway **${giveaway.title}** (ID ${giveaway.id}) by <@${interaction.user.id}>.`);
    return interaction.reply({ content: `Credited **${pendingInvites}** tracked invite entries to **${player.username}** and marked them as processed.`, ephemeral: true });
  }
};
