import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { budgetSql, consumeBudget } from '../apps/backend/src/rate-limit';
import { createApp } from '../apps/backend/src/app';
it('uses an atomic SQLite budget, refills once and never rolls its window backwards', () => {
  const code = `import sqlite3,json,sys\nc=sqlite3.connect(':memory:')\nc.execute('CREATE TABLE request_budget (key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL)')\nsql=json.loads(sys.argv[1])\nrows=[c.execute(sql,(10,)).fetchone() for _ in range(121)]\nassert rows[-1]==(10,121)\nassert c.execute(sql,(11,)).fetchone()==(11,1)\nassert c.execute(sql,(10,)).fetchone()==(11,2)\nassert c.execute('SELECT count(*) FROM request_budget').fetchone()[0]==1\nprint('ok')`;
  expect(
    execFileSync('python3', ['-c', code, JSON.stringify(budgetSql)], {
      encoding: 'utf8',
    }).trim(),
  ).toBe('ok');
});
it('calculates Retry-After and fails closed if the distributed store fails', async () => {
  const db = {
    prepare: () => ({
      bind: () => ({ first: async <T>() => ({ window: 1, count: 121 }) as T }),
      first: async <T>() => null as T | null,
    }),
  };
  expect(await consumeBudget(db, 61000, 120)).toEqual({
    allowed: false,
    retryAfter: 59,
  });
  const failing = {
    prepare: () => {
      throw new Error('offline');
    },
  };
  const app = createApp();
  expect(
    (await app.request('/api/health/ready', {}, { DB: failing })).status,
  ).toBe(503);
  const r = await app.request(
    '/api/v1/predictions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"symptoms":["fever"]}',
    },
    { DB: failing },
  );
  expect(r.status).toBe(503);
  expect((await r.json()).error.code).toBe('SERVICE_UNAVAILABLE');
});
