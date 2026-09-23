export interface BudgetDatabase {
  prepare(sql: string): {
    bind(...values: unknown[]): { first<T>(): Promise<T | null> };
    first<T>(): Promise<T | null>;
  };
}
// One aggregate row, no IPs, symptoms, coordinates or visitor identifiers.
export const budgetSql = `INSERT INTO request_budget (key, window, count) VALUES ('predictions', ?, 1)
ON CONFLICT(key) DO UPDATE SET
window = MAX(request_budget.window, excluded.window),
count = CASE WHEN request_budget.window < excluded.window THEN 1 ELSE MIN(request_budget.count + 1, 1000000) END
RETURNING window, count`;
export async function consumeBudget(
  db: BudgetDatabase,
  now: number,
  maximum: number,
) {
  const row = await db
    .prepare(budgetSql)
    .bind(Math.floor(now / 60000))
    .first<{ window: number; count: number }>();
  if (!row) throw new Error('Request budget is unavailable');
  return {
    allowed: row.count <= maximum,
    retryAfter: Math.max(1, Math.ceil(((row.window + 1) * 60000 - now) / 1000)),
  };
}
