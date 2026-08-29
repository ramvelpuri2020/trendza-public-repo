/**
 * demoStore.ts — a tiny, localStorage-backed stand-in for the tables the app
 * reads/writes through `supabase.from(...)`.
 *
 * We do NOT try to replicate PostgREST. We only need to satisfy the subset of
 * the query surface the real app actually uses (`select` with column lists,
 * `eq`/`in`/`gte`/`lte` filters, `order`, `limit`, `single`/`maybeSingle`,
 * insert, upsert w/ onConflict, update, delete) so that the existing
 * components run **unchanged** against a local store when no real backend keys
 * are set.
 *
 * Persistence is per-table under a single localStorage key for the demo
 * profile, so saved outfits, clipped items, and planned dates survive reloads.
 */

export const DEMO_LOCAL_KEY = "trendza_demo_state_v1";

export type Row = Record<string, any>;

let cache: Record<string, Row[]> | null = null;

function load(): Record<string, Row[]> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DEMO_LOCAL_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, Row[]>) : {};
  } catch {
    cache = {};
  }
  if (typeof cache !== "object" || cache === null) cache = {};
  return cache!;
}

function persist(): void {
  try {
    localStorage.setItem(DEMO_LOCAL_KEY, JSON.stringify(cache ?? {}));
  } catch {
    // quota exceeded — ignore; in-memory only
  }
}

/** Overwrite a whole table (used by seeding), keeping any later user edits. */
export function setTable(table: string, rows: Row[]): void {
  const db = load();
  db[table] = rows;
  persist();
}

export function getTable(table: string): Row[] {
  return load()[table] ?? [];
}

export function hasTable(table: string): boolean {
  return Array.isArray(load()[table]);
}

export function seedTableIfEmpty(table: string, rows: Row[]): void {
  const db = load();
  if (Array.isArray(db[table]) && db[table].length > 0) return;
  db[table] = rows;
  persist();
}

function upsertRows(table: string, rows: Row[], onConflictCols: string[]): void {
  const db = load();
  const cur = db[table] ?? [];
  for (const row of rows) {
    const idx = cur.findIndex((r) =>
      onConflictCols.every((c) => r[c] === row[c]),
    );
    if (idx === -1) cur.push(row);
    else cur[idx] = row;
  }
  db[table] = cur;
  persist();
}

function updateRows(
  table: string,
  patch: Row,
  matcher: Row,
): { count: number; rows: Row[] } {
  const db = load();
  const cur = db[table] ?? [];
  let changed = 0;
  const updated: Row[] = [];
  const next = cur.map((r) => {
    const match = Object.entries(matcher).every(([k, v]) => r[k] === v);
    if (!match) return r;
    const merged = { ...r, ...patch };
    updated.push(merged);
    changed++;
    return merged;
  });
  db[table] = next;
  persist();
  return { count: changed, rows: updated };
}

function deleteRows(table: string, matcher: Row): number {
  const db = load();
  const before = (db[table] ?? []).length;
  db[table] = (db[table] ?? []).filter(
    (r) => !Object.entries(matcher).every(([k, v]) => r[k] === v),
  );
  persist();
  return before - (db[table]?.length ?? 0);
}

type OpKind = "select" | "insert" | "update" | "delete";

/**
 * Minimal query chain. The app awaits the final value and reads
 * `{ data, error }`, so we resolve to that shape. Because `DemoQuery` exposes
 * a `then` method it's automatically thenable — `await supabase.from(...)...`
 * resolves to the result of `then`.
 */
export class DemoQuery implements PromiseLike<{ data: any; error: any }> {
  private table: string;
  private kind: OpKind;
  /** For insert/upsert: rows to put in. */
  private payload: Row | Row[] | null = null;
  private onConflictCols: string[] = ["id"];
  private ignoreDuplicates = false;
  private matcher: Row = {};
  private selectCols: string[] | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private singleMode = false;
  private maybeSingleMode = false;

  constructor(table: string, kind: OpKind = "select") {
    this.table = table;
    this.kind = kind;
  }

  // ── builders ────────────────────────────────────────────────
  select(cols?: string): this {
    this.kind = this.kind === "select" ? "select" : this.kind;
    this.selectCols = cols
      ? cols
          .replace(/\s/g, "")
          .split(",")
          .filter(Boolean)
      : null;
    return this;
  }

  insert(rows: Row | Row[]): this {
    this.kind = "insert";
    this.payload = rows;
    return this;
  }

  upsert(rows: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }): this {
    this.kind = "insert";
    this.payload = rows;
    this.onConflictCols = (opts?.onConflict ?? "id")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    this.ignoreDuplicates = opts?.ignoreDuplicates ?? false;
    return this;
  }

  update(patch: Row): this {
    this.kind = "update";
    this.payload = patch;
    return this;
  }

  delete(): this {
    this.kind = "delete";
    return this;
  }

  eq(col: string, val: any): this {
    this.matcher[col] = val;
    return this;
  }

  in(col: string, vals: any[]): this {
    // `in()` applies to the source rows for select; for update/delete the app
    // only uses `eq`. To keep predicate evaluation uniform we record a special
    // marker resolved during exec by filtering the table.
    this._filters.push({ col, values: vals });
    return this;
  }

  gte(col: string, val: any): this {
    this._filters.push({ col, gte: val });
    return this;
  }

  lte(col: string, val: any): this {
    this._filters.push({ col, lte: val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  single(): this {
    this.singleMode = true;
    return this;
  }

  maybeSingle(): this {
    this.maybeSingleMode = true;
    return this;
  }

  private _filters: Array<{
    col?: string;
    val?: any;
    values?: any[];
    gte?: any;
    lte?: any;
  }> = [];

  // ── execution ───────────────────────────────────────────────
  private matches(row: Row): boolean {
    for (const f of this._filters) {
      if (f.values) {
        if (!f.values.includes(row[f.col!])) return false;
      } else if (f.gte !== undefined) {
        if (!(row[f.col!] >= f.gte)) return false;
      } else if (f.lte !== undefined) {
        if (!(row[f.col!] <= f.lte)) return false;
      } else if (f.col !== undefined && row[f.col!] !== f.val) {
        return false;
      }
    }
    for (const [k, v] of Object.entries(this.matcher)) {
      if (row[k] !== v) return false;
    }
    return true;
  }

  async exec(): Promise<{ data: any; error: any }> {
    const table = this.table;

    if (this.kind === "select") {
      const all = getTable(table);
      let rows = all.filter((r) => this.matches(r));
      if (this.orderCol) {
        const asc = this.orderAsc;
        rows = [...rows].sort((a, b) => {
          const av = a[this.orderCol!];
          const bv = b[this.orderCol!];
          if (av === bv) return 0;
          const cmp = av > bv ? 1 : -1;
          return asc ? cmp : -cmp;
        });
      }
      if (this.limitN != null) rows = rows.slice(0, this.limitN);

      if (this.singleMode) {
        if (rows.length === 1)
          return { data: this.project(rows[0]), error: null };
        if (rows.length === 0)
          return {
            data: null,
            error: { code: "PGRST116", message: "No rows found" },
          };
        return { data: null, error: { message: "Expected a single row" } };
      }
      if (this.maybeSingleMode) {
        return { data: rows[0] ? this.project(rows[0]) : null, error: null };
      }
      return { data: rows.map((r) => this.project(r)), error: null };
    }

    if (this.kind === "insert") {
      const input = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const batch = input.map((p) => {
        if (!p.id && !this.onConflictCols.includes("id")) return { ...p };
        if (p.id) return p;
        return p;
      });
      upsertRows(table, batch, this.onConflictCols);
      const fresh = getTable(table).filter((r) =>
        this.onConflictCols.every((c) =>
          batch.some((b) => b[c] === r[c]),
        ),
      );
      if (this.singleMode) return { data: fresh[fresh.length - 1] ?? batch[0], error: null };
      return { data: fresh, error: null };
    }

    if (this.kind === "update") {
      const { rows } = updateRows(table, this.payload!, this.matcher);
      if (this.singleMode)
        return { data: rows[rows.length - 1] ?? null, error: rows.length ? null : { message: "No rows" } };
      return { data: rows, error: null };
    }

    // delete
    const count = deleteRows(table, this.matcher);
    return { data: null, error: null };
  }

  private project(row: Row): Row {
    if (!this.selectCols) return row;
    const out: Row = {};
    for (const c of this.selectCols) {
      if (c in row) out[c] = row[c];
    }
    return out;
  }

  // thenable — lets `await supabase.from(...)...` resolve to {data,error}.
  then<TResult1 = { data: any; error: any }, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }
}