const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const paymentService = require('../services/paymentService');
const banService = require('../services/banService');
const eventService = require('../services/eventService');
const giveawayService = require('../services/giveawayService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mask-dashboard')
    .setDescription('Show Fiebs Little Helper dashboard summary.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const pay = paymentService.summary();
    const bans = banService.active();
    const activeEvent = eventService.getLatestActiveEvent();
    const giveaway = giveawayService.getLatestOpenGiveaway();

    const embed = new EmbedBuilder()
      .setTitle('Fiebs Little Helper Dashboard')
      .setDescription([
        `**Open payments:** ${pay.open_count} / ${pay.open_total.toFixed(2)}`,
        `**Paid total:** ${pay.paid_count} / ${pay.paid_total.toFixed(2)}`,
        `**Active event bans:** ${bans.length}`,
        `**Active event:** ${activeEvent ? `${activeEvent.name} (ID ${activeEvent.id})` : 'None'}`,
        `**Open giveaway:** ${giveaway ? `${giveaway.title} (ID ${giveaway.id})` : 'None'}`
      ].join('\n'));

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
