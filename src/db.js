import Dexie from 'dexie';

export const db = new Dexie('NugabomDB');

db.version(1).stores({
  observations: 'id, studentId, date, domain, category, stdCode',
  students: 'id, number, name',
  settings: 'key',
});

// Settings helpers
export async function getSetting(key, fallback) {
  const row = await db.settings.get(key);
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}
