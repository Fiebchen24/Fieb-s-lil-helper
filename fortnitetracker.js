const fetch = require('node-fetch');

async function getFortnitePR({ epic, platform = 'pc', region = 'EU' }) {
  const apiKey = process.env.TRN_API_KEY;
  if (!apiKey) throw new Error('TRN_API_KEY fehlt in .env');

  const url = `https://api.tracker.gg/v1/powerrankings/${platform}/${region}/${encodeURIComponent(epic)}`;

  const res = await fetch(url, {
    headers: {
      'TRN-Api-Key': apiKey,
      Accept: 'application/json'
    }
  });

  if (!res.ok) throw new Error(`Tracker API Fehler: ${res.status}`);

  return res.json();
}

function numberValue(value) {
  if (value === undefined || value === null) return 0;
  return Number(String(value).replace(/[$,]/g, '')) || 0;
}

function getRoleByStats(stats) {
  const pr = numberValue(stats.points || stats.Points);
  const earnings = numberValue(stats.cashPrize || stats.CashPrize);

  if (earnings > 0) return 'Earned Player';
  if (pr >= 1000) return 'Pro';
  if (pr >= 500) return 'Esports';
  if (pr >= 1) return 'Competitive';
  return 'Community';
}

module.exports = { getFortnitePR, getRoleByStats };