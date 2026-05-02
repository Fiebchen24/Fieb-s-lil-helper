const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function read(name, fallback) {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return structuredCloneSafe(fallback);
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'));
  } catch (error) {
    console.error(`Failed to read data/${name}.json`, error);
    return structuredCloneSafe(fallback);
  }
}

function write(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
  return data;
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { read, write, nextId };
