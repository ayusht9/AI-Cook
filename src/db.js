import Dexie from 'dexie';

export const db = new Dexie('CookingAppDB');

db.version(1).stores({
  users: '++id, username',
  history: '++id, userId, timestamp',
});
