function parseShoppingText(summary) {
  const raw = String(summary || '').trim();
  if (!raw) {
    throw new Error('Shopping item summary is empty');
  }

  const patterns = [
    /^(?<qty>\d+)\s*x\s+(?<name>.+)$/i,
    /^(?<qty>\d+)\s+(?<name>.+)$/i,
    /^(?<name>.+?)\s+x\s*(?<qty>\d+)$/i
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.groups?.qty && match?.groups?.name) {
      return {
        original: raw,
        query: match.groups.name.trim(),
        quantity: Math.max(1, Number.parseInt(match.groups.qty, 10))
      };
    }
  }

  return {
    original: raw,
    query: raw,
    quantity: 1
  };
}

module.exports = { parseShoppingText };
