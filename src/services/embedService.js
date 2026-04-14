const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function eventEmbed(event, counts = {}) {
  return new EmbedBuilder()
    .setTitle('Butter Event Registration')
    .setDescription([
      `**Event:** ${event.name}`,
      `**Format:** ${event.format}`,
      `**Region:** ${event.region}`,
      `**Start Time:** <t:${Math.floor(new Date(event.start_time).getTime() / 1000)}:F>`,
      `**Games:** ${event.games}`,
      `**Slots:** ${counts.main ?? 0}/${event.max_players}`,
      `**Queue:** ${counts.queue ?? 0}`,
      '',
      'Click **Join** to play.',
      'If the event is full, use **Join Queue**.',
      'Check-in is required before the event starts.'
    ].join('\n'))
    .setFooter({ text: `Event ID: ${event.id}` });
}

function eventButtons(eventId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_join:${eventId}`)
      .setLabel('Join')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`event_leave:${eventId}`)
      .setLabel('Leave')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`event_queue:${eventId}`)
      .setLabel('Join Queue')
      .setStyle(ButtonStyle.Primary)
  );
}

function checkinEmbed(event, summary = {}) {
  return new EmbedBuilder()
    .setTitle('Check-In Open')
    .setDescription([
      `**Event:** ${event.name}`,
      `**Closes:** <t:${Math.floor(new Date(event.start_time).getTime() / 1000)}:R>`,
      '',
      'Click **Check In** to confirm your spot.',
      'Players who do not check in will lose their slot.',
      '',
      `Checked in: **${summary.checkedIn ?? 0}**`
    ].join('\n'))
    .setFooter({ text: `Event ID: ${event.id}` });
}

function checkinButtons(eventId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`event_checkin:${eventId}`)
      .setLabel('Check In')
      .setStyle(ButtonStyle.Success)
  );
}

function lobbyEmbed(event, code) {
  return new EmbedBuilder()
    .setTitle('Lobby Information')
    .setDescription([
      `**Event:** ${event.name}`,
      `**Region:** ${event.region}`,
      `**Format:** ${event.format}`,
      `**Custom Code:** \`${code}\``,
      '',
      'Only checked-in players may play.'
    ].join('\n'))
    .setFooter({ text: `Event ID: ${event.id}` });
}

function leaderboardEmbed(event) {
  const lines = [
    '**Results Source:** Yunite leaderboard',
    '',
    'Players do **not** submit results in this setup.',
    'Staff can verify standings directly on Yunite and then award season points if needed.'
  ];

  if (event.yunite_url) {
    lines.push('', `**Yunite Link:** ${event.yunite_url}`);
  }

  return new EmbedBuilder()
    .setTitle(`Leaderboard • ${event.name}`)
    .setDescription(lines.join('\n'))
    .setFooter({ text: `Event ID: ${event.id}` });
}

function hostPanelEmbed(event) {
  return new EmbedBuilder()
    .setTitle('Butter Host Panel')
    .setDescription([
      `**Event:** ${event.name}`,
      `**Status:** ${event.status}`,
      event.yunite_url ? `**Yunite:** ${event.yunite_url}` : '**Yunite:** not set',
      '',
      'Use the buttons below to control the live event.',
      'Season points and trusted roles are handled with slash commands after Yunite results are checked.'
    ].join('\n'))
    .setFooter({ text: `Event ID: ${event.id}` });
}

function hostPanelButtons(eventId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`host_open_checkin:${eventId}`).setLabel('Open Check-In').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`host_close_checkin:${eventId}`).setLabel('Close Check-In').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`host_post_lobby:${eventId}`).setLabel('Post Lobby').setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`host_refresh_board:${eventId}`).setLabel('Refresh Leaderboard').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`host_end_event:${eventId}`).setLabel('End Event').setStyle(ButtonStyle.Danger)
    )
  ];
}

module.exports = {
  eventEmbed,
  eventButtons,
  checkinEmbed,
  checkinButtons,
  lobbyEmbed,
  leaderboardEmbed,
  hostPanelEmbed,
  hostPanelButtons
};
