const inviteService = require('./inviteService');

const inviteCache = new Map();

async function seedGuildInvites(guild) {
  if (!guild?.members?.me?.permissions?.has('ManageGuild')) {
    return;
  }
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return;
  const snapshot = new Map();
  for (const invite of invites.values()) {
    snapshot.set(invite.code, {
      uses: invite.uses ?? 0,
      inviterId: invite.inviter?.id || null,
      inviterName: invite.inviter?.username || 'Unknown'
    });
  }
  inviteCache.set(guild.id, snapshot);
}

async function refreshGuildInvites(guild) {
  await seedGuildInvites(guild);
}

async function handleMemberJoin(member) {
  const guild = member.guild;
  if (!guild?.members?.me?.permissions?.has('ManageGuild')) {
    return null;
  }

  const oldSnapshot = inviteCache.get(guild.id) || new Map();
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return null;

  let usedInvite = null;
  for (const invite of invites.values()) {
    const oldInvite = oldSnapshot.get(invite.code);
    const oldUses = oldInvite?.uses ?? 0;
    const newUses = invite.uses ?? 0;
    if (newUses > oldUses) {
      usedInvite = invite;
      break;
    }
  }

  const newSnapshot = new Map();
  for (const invite of invites.values()) {
    newSnapshot.set(invite.code, {
      uses: invite.uses ?? 0,
      inviterId: invite.inviter?.id || null,
      inviterName: invite.inviter?.username || 'Unknown'
    });
  }
  inviteCache.set(guild.id, newSnapshot);

  if (!usedInvite?.inviter || usedInvite.inviter.id === member.id) {
    return null;
  }

  inviteService.recordInviteJoin({
    guildId: guild.id,
    inviter: usedInvite.inviter,
    invitedUser: member.user,
    inviteCode: usedInvite.code
  });

  return {
    inviter: usedInvite.inviter,
    inviteCode: usedInvite.code
  };
}

module.exports = {
  seedGuildInvites,
  refreshGuildInvites,
  handleMemberJoin
};
