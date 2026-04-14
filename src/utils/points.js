function placementPoints(placement) {
  if (placement <= 1) return 25;
  if (placement === 2) return 20;
  if (placement === 3) return 17;
  if (placement === 4) return 15;
  if (placement === 5) return 13;
  if (placement <= 10) return 10;
  if (placement <= 15) return 7;
  if (placement <= 20) return 5;
  return 0;
}

function totalPoints(placement, eliminations) {
  return placementPoints(placement) + Math.max(0, Number(eliminations) || 0);
}

module.exports = {
  placementPoints,
  totalPoints
};
