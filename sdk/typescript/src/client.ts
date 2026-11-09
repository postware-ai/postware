// The hand-written client of @postware/sdk.
// Types come from ./types, generated from the compiled standard.
import { modelNames } from "./types";
import type { ModelMap, ModelName, EnvelopeWherePath, Ref } from "./types";

// --- errors --------------------------------------------------------------------

export interface ErrorDetail {
  path?: string;
  code: string;
  message?: string;
}

/** The API error envelope of 02-query.md section 7, as an exception. */
export class PostwareError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: ErrorDetail[];
  readonly retryAfter?: number;

  constructor(status: number, code: string, message: string, details: ErrorDetail[] = [], retryAfter?: number) {
    super(message);
    this.name = "PostwareError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }

  static async fromResponse(res: Response): Promise<PostwareError> {
    let code = "internal";
    let message = res.statusText || "request failed";
    let details: ErrorDetail[] = [];
    try {
      const body = (await res.json()) as { error?: { code?: string; message?: string; details?: ErrorDetail[] } };
      if (body && body.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
        details = body.error.details ?? [];
      }
    } catch {
      // not JSON; keep the status text
    }
    if (res.status === 401 && code === "internal") code = "unauthorized";
    const ra = res.headers.get("Retry-After");
    return new PostwareError(res.status, code, message, details, ra ? Number(ra) : undefined);
  }
}

// --- query grammar ---------------------------------------------------------------

export type Scalar = string | number | boolean | null;

export interface Operators {
  eq?: Scalar;
  ne?: Scalar;
  lt?: Scalar;
  lte?: Scalar;
  gt?: Scalar;
  gte?: Scalar;
  in?: Scalar[];
  nin?: Scalar[];
  contains?: string;
  starts_with?: string;
  ends_with?: string;
  is_null?: boolean;
  exists?: boolean;
  any?: Scalar[];
  all?: Scalar[];
  none?: Scalar[];
  between?: [Scalar, Scalar];
}

export type Condition = Scalar | Operators | Record<string, unknown>;

/** A where object: field paths (typed per model) or and/or/not. */
export type Where<P extends string = string> = {
  [K in P | EnvelopeWherePath]?: Condition;
} & {
  and?: Where<P>[];
  or?: Where<P>[];
  not?: Where<P>;
};

export interface Query<P extends string = string> {
  where?: Where<P>;
  order?: string[];
  limit?: number;
  cursor?: string;
  include?: string[];
  fields?: string[];
  search?: string;
  include_deleted?: boolean;
}

export interface Page<T> {
  data: T[];
  included: Record<string, unknown>;
  next_cursor: string | null;
}

export interface Single<T> {
  data: T;
  included?: Record<string, unknown>;
}

export type Match = "identity" | { identifiers: { system: string; value: string }[] };

export interface BatchOperation {
  op: "create" | "update" | "upsert" | "delete";
  model: ModelName | string;
  id?: string;
  if_match?: number;
  data?: Record<string, unknown>;
}

export interface BatchResult {
  op: string;
  model: string;
  id?: string;
  status: number | string;
  data?: Record<string, unknown>;
  error?: { code: string; message: string; details?: ErrorDetail[] };
  [key: string]: unknown;
}

export interface SearchHit {
  model: string;
  id: string;
  snippet: string;
  record?: Record<string, unknown>;
}

export interface EventMessage {
  seq: number;
  event: string;
  model?: string;
  id?: string;
  record?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}

// --- transport -------------------------------------------------------------------

export interface ClientOptions {
  /** The server base URL, e.g. https://api.example.com */
  baseUrl: string;
  /** The workspace slug. */
  workspace: string;
  /** An access token, API key or share token. */
  token?: string;
  /** Custom fetch (Node < 18, tests). */
  fetch?: typeof fetch;
  /** Where tokens from the magic-link flow are kept; defaults to localStorage when present. */
  storage?: TokenStorage;
}

export interface TokenStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  raw?: boolean;
}

class Transport {
  readonly baseUrl: string;
  token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(baseUrl: string, token: string | undefined, fetchImpl?: typeof fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  url(path: string, query?: RequestOptions["query"]): string {
    const u = new URL(this.baseUrl + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, String(v));
      }
    }
    return u.toString();
  }

  async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json", ...(opts.headers ?? {}) };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    let body: BodyInit | undefined;
    if (opts.body !== undefined) {
      if (opts.body instanceof Blob || opts.body instanceof ArrayBuffer || typeof opts.body === "string") {
        body = opts.body as BodyInit;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(opts.body);
      }
    }
    const res = await this.fetchImpl(this.url(path, opts.query), { method: opts.method ?? "GET", headers, body });
    if (!res.ok) throw await PostwareError.fromResponse(res);
    if (opts.raw) return res as unknown as T;
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  async stream(path: string, headers: Record<string, string>, signal?: AbortSignal): Promise<Response> {
    const h: Record<string, string> = { Accept: "text/event-stream", ...headers };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    const res = await this.fetchImpl(this.url(path), { headers: h, signal });
    if (!res.ok) throw await PostwareError.fromResponse(res);
    return res;
  }
}

// --- collections -----------------------------------------------------------------

type RecordOf<K extends ModelName> = ModelMap[K]["record"];
type InputOf<K extends ModelName> = ModelMap[K]["input"];
type WhereOf<K extends ModelName> = ModelMap[K]["where"];

/** The per-model surface: a.person.query(...), a.invoice.create(...). */
export class Records<K extends ModelName> {
  constructor(
    private readonly t: Transport,
    private readonly prefix: string,
    readonly model: K,
  ) {}

  query(q: Query<WhereOf<K>> = {}): Promise<Page<RecordOf<K>>> {
    return this.t.request(`${this.prefix}/${this.model}/query`, { method: "POST", body: q });
  }

  /** Iterates every page of a query. */
  async *iterate(q: Query<WhereOf<K>> = {}): AsyncGenerator<RecordOf<K>> {
    let cursor: string | undefined = q.cursor;
    for (;;) {
      const page: Page<RecordOf<K>> = await this.query({ ...q, cursor });
      for (const r of page.data) yield r;
      if (!page.next_cursor) return;
      cursor = page.next_cursor;
    }
  }

  async get(id: string, opts: { include?: string[] } = {}): Promise<RecordOf<K>> {
    const res = await this.t.request<Single<RecordOf<K>>>(`${this.prefix}/${this.model}/${encodeURIComponent(id)}`, {
      query: { include: opts.include?.join(",") },
    });
    return res.data;
  }

  async create(data: InputOf<K>, opts: { idempotencyKey?: string } = {}): Promise<RecordOf<K>> {
    const headers: Record<string, string> = {};
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
    const res = await this.t.request<Single<RecordOf<K>>>(`${this.prefix}/${this.model}`, { method: "POST", body: data, headers });
    return res.data;
  }

  async update(id: string, patch: Partial<InputOf<K>>, opts: { ifMatch?: number; force?: boolean } = {}): Promise<RecordOf<K>> {
    const headers: Record<string, string> = {};
    if (opts.ifMatch !== undefined) headers["If-Match"] = String(opts.ifMatch);
    const res = await this.t.request<Single<RecordOf<K>>>(`${this.prefix}/${this.model}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
      headers,
      query: { force: opts.force ? "true" : undefined },
    });
    return res.data;
  }

  async upsert(data: InputOf<K>, match: Match = "identity"): Promise<{ record: RecordOf<K>; created: boolean }> {
    const res = await this.t.request<Response>(`${this.prefix}/${this.model}/upsert`, {
      method: "POST",
      body: { ...(data as unknown as Record<string, unknown>), match },
      raw: true,
    });
    const body = (await res.json()) as Single<RecordOf<K>> & { created?: boolean };
    return { record: body.data, created: body.created ?? res.status === 201 };
  }

  async delete(id: string, opts: { hard?: boolean } = {}): Promise<void> {
    await this.t.request(`${this.prefix}/${this.model}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      query: { hard: opts.hard ? "true" : undefined },
    });
  }

  async history(id: string): Promise<Record<string, unknown>[]> {
    const res = await this.t.request<{ data: Record<string, unknown>[] }>(`${this.prefix}/${this.model}/${encodeURIComponent(id)}/history`);
    return res.data;
  }

  async search(text: string, opts: { limit?: number; where?: Where<WhereOf<K>> } = {}): Promise<Page<RecordOf<K>>> {
    return this.query({ search: text, limit: opts.limit, where: opts.where });
  }
}

type ModelRecords = { readonly [K in ModelName]: Records<K> };

// --- the client --------------------------------------------------------------------

export interface SchemaSummary {
  name: string;
  urn: string;
  title: string;
  group: string;
  description: string;
  version?: number;
}

export interface Me {
  principal: { kind: string; id?: string; member_id?: string; person_id?: string; roles?: string[]; scopes?: string[] };
  member?: Record<string, unknown>;
  person?: Record<string, unknown>;
  scopes: string[];
  workspace: { slug: string; name?: string; plan: string; limits: Record<string, number> };
}

export interface Job {
  id: string;
  kind: string;
  state: string;
  attempts?: number;
  result?: Record<string, unknown>;
  download_url?: string;
  [key: string]: unknown;
}

const TOKEN_KEY = "postware.access_token";
const REFRESH_KEY = "postware.refresh_token";

function defaultStorage(): TokenStorage | undefined {
  const g = globalThis as unknown as { localStorage?: Storage };
  if (!g.localStorage) return undefined;
  const ls = g.localStorage;
  return {
    get: (k) => ls.getItem(k),
    set: (k, v) => ls.setItem(k, v),
    remove: (k) => ls.removeItem(k),
  };
}

/** Reads a workspace through its public endpoint (/p/{ws}): read only. */
export class PublicClient {
  private readonly t: Transport;
  private readonly recs = new Map<string, Records<ModelName>>();
  constructor(baseUrl: string, readonly workspaceSlug: string, fetchImpl?: typeof fetch) {
    this.t = new Transport(baseUrl, undefined, fetchImpl);
    return proxied(this);
  }
  /** The records of one model by name; the same as `pub.document` for dynamic names. */
  records<K extends ModelName>(name: K): Records<K> {
    let c = this.recs.get(name);
    if (!c) {
      c = new Records(this.t, `/p/${encodeURIComponent(this.workspaceSlug)}`, name) as Records<ModelName>;
      this.recs.set(name, c);
    }
    return c as unknown as Records<K>;
  }
}
export interface PublicClient extends ModelRecords {}

/** Reads through a share link (/s/{token}): read only. */
export class ShareClient {
  private readonly t: Transport;
  private readonly recs = new Map<string, Records<ModelName>>();
  constructor(baseUrl: string, readonly token: string, fetchImpl?: typeof fetch) {
    this.t = new Transport(baseUrl, undefined, fetchImpl);
    return proxied(this);
  }
  records<K extends ModelName>(name: K): Records<K> {
    let c = this.recs.get(name);
    if (!c) {
      c = new Records(this.t, `/s/${encodeURIComponent(this.token)}`, name) as Records<ModelName>;
      this.recs.set(name, c);
    }
    return c as unknown as Records<K>;
  }
}
export interface ShareClient extends ModelRecords {}

const modelSet: ReadonlySet<string> = new Set<string>(modelNames);

/** Resolves `client.<model>` to the Records of that model. */
function proxied<T extends object & { records(name: ModelName): unknown }>(target: T): T {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === "string" && !(prop in obj) && modelSet.has(prop)) {
        return obj.records(prop as ModelName);
      }
      return Reflect.get(obj, prop, receiver);
    },
  });
}

export class Postware {
  readonly baseUrl: string;
  /** The workspace slug (named so that `a.workspace` stays the Workspace records). */
  readonly workspaceSlug: string;
  private readonly t: Transport;
  private readonly recs = new Map<string, Records<ModelName>>();
  private readonly storage?: TokenStorage;
  private readonly fetchImpl?: typeof fetch;
  private readonly prefix: string;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.workspaceSlug = opts.workspace;
    this.storage = opts.storage ?? defaultStorage();
    this.fetchImpl = opts.fetch;
    const token = opts.token ?? this.storage?.get(TOKEN_KEY) ?? undefined;
    this.t = new Transport(this.baseUrl, token, opts.fetch);
    this.prefix = `/w/${encodeURIComponent(this.workspaceSlug)}/v1`;
    return proxied(this);
  }

  /** The token in use (access token, API key or share token). */
  get token(): string | undefined {
    return this.t.token;
  }

  set token(value: string | undefined) {
    this.t.token = value;
  }

  /** The records of one model by name; the same as `a.person` but for dynamic names. */
  records<K extends ModelName>(name: K): Records<K> {
    let c = this.recs.get(name);
    if (!c) {
      c = new Records(this.t, this.prefix, name) as Records<ModelName>;
      this.recs.set(name, c);
    }
    return c as unknown as Records<K>;
  }

  /** Public reads of another (or the same) workspace: /p/{ws}. */
  public(workspace: string = this.workspaceSlug): PublicClient {
    return new PublicClient(this.baseUrl, workspace, this.fetchImpl);
  }

  /** Reads through a share link token: /s/{token}. (`a.share` is the Share records.) */
  shareLink(token: string): ShareClient {
    return new ShareClient(this.baseUrl, token, this.fetchImpl);
  }

  async batch(operations: BatchOperation[], opts: { atomic?: boolean; dryRun?: boolean; idempotencyKey?: string } = {}): Promise<BatchResult[]> {
    const headers: Record<string, string> = {};
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
    const res = await this.t.request<{ data: { results: BatchResult[] } }>(`${this.prefix}/batch`, {
      method: "POST",
      headers,
      body: { operations, atomic: opts.atomic ?? true, dry_run: opts.dryRun ?? false },
    });
    return res.data.results;
  }

  async search(text: string, opts: { models?: string[]; limit?: number } = {}): Promise<SearchHit[]> {
    const res = await this.t.request<{ data: { hits: SearchHit[] } }>(`${this.prefix}/search`, {
      method: "POST",
      body: { search: text, models: opts.models, limit: opts.limit },
    });
    return res.data.hits;
  }

  me(): Promise<Me> {
    return this.t.request<{ data: Me }>(`${this.prefix}/me`).then((r) => r.data);
  }

  stats(): Promise<Record<string, unknown>> {
    return this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/stats`).then((r) => r.data);
  }

  readonly schema = {
    list: (): Promise<SchemaSummary[]> => this.t.request<{ data: SchemaSummary[] }>(`${this.prefix}/schema`).then((r) => r.data),
    get: (model: string): Promise<Record<string, unknown>> =>
      this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/schema/${encodeURIComponent(model)}`).then((r) => r.data),
    extensions: (): Promise<Record<string, unknown>[]> =>
      this.t.request<{ data: Record<string, unknown>[] }>(`${this.prefix}/schema/extensions`).then((r) => r.data),
    declareExtension: (decl: Record<string, unknown>): Promise<Record<string, unknown>> =>
      this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/schema/extensions`, { method: "POST", body: decl }).then((r) => r.data),
  };

  readonly auth = {
    magicLink: {
      /** Sends the magic link; always resolves (no account enumeration). */
      request: (email: string, redirectUri?: string): Promise<void> =>
        this.t
          .request(`/w/${encodeURIComponent(this.workspaceSlug)}/auth/magic-link`, { method: "POST", body: { email, redirect_uri: redirectUri } })
          .then(() => undefined),
      /** Reads #access_token=...&refresh_token=... from the current location, stores them and clears the hash. */
      handleCallback: (location?: { hash: string }): { accessToken: string; refreshToken?: string } | null => {
        const loc = location ?? (globalThis as unknown as { location?: { hash: string } }).location;
        if (!loc || !loc.hash) return null;
        const params = new URLSearchParams(loc.hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        if (!accessToken) return null;
        const refreshToken = params.get("refresh_token") ?? undefined;
        this.setTokens(accessToken, refreshToken);
        const h = (globalThis as unknown as { history?: History; location?: Location }).history;
        const l = (globalThis as unknown as { location?: Location }).location;
        if (h && l) h.replaceState(null, "", l.pathname + l.search);
        return { accessToken, refreshToken };
      },
    },
    /** Exchanges the stored refresh token for a new access token. */
    refresh: async (refreshToken?: string): Promise<{ accessToken: string; refreshToken?: string }> => {
      const rt = refreshToken ?? this.storage?.get(REFRESH_KEY);
      if (!rt) throw new PostwareError(401, "unauthorized", "no refresh token");
      const res = await this.t.request<{ access_token: string; refresh_token?: string }>(`/w/${encodeURIComponent(this.workspaceSlug)}/auth/token`, {
        method: "POST",
        body: { grant_type: "refresh_token", refresh_token: rt },
      });
      this.setTokens(res.access_token, res.refresh_token ?? rt);
      return { accessToken: res.access_token, refreshToken: res.refresh_token ?? rt };
    },
    logout: async (): Promise<void> => {
      const rt = this.storage?.get(REFRESH_KEY);
      try {
        await this.t.request(`/w/${encodeURIComponent(this.workspaceSlug)}/auth/logout`, { method: "POST", body: { refresh_token: rt } });
      } finally {
        this.storage?.remove(TOKEN_KEY);
        this.storage?.remove(REFRESH_KEY);
        this.t.token = undefined;
      }
    },
    keys: {
      list: (): Promise<Record<string, unknown>[]> =>
        this.t.request<{ data: Record<string, unknown>[] }>(`/w/${encodeURIComponent(this.workspaceSlug)}/auth/keys`).then((r) => r.data),
      create: (req: { member?: string; name: string; scopes: string[]; where?: Where }): Promise<Record<string, unknown>> =>
        this.t.request<{ data: Record<string, unknown> }>(`/w/${encodeURIComponent(this.workspaceSlug)}/auth/keys`, { method: "POST", body: req }).then((r) => r.data),
      revoke: (id: string): Promise<void> =>
        this.t.request(`/w/${encodeURIComponent(this.workspaceSlug)}/auth/keys/${encodeURIComponent(id)}`, { method: "DELETE" }).then(() => undefined),
    },
  };

  private setTokens(accessToken: string, refreshToken?: string): void {
    this.t.token = accessToken;
    this.storage?.set(TOKEN_KEY, accessToken);
    if (refreshToken) this.storage?.set(REFRESH_KEY, refreshToken);
  }

  readonly events = {
    /**
     * Subscribes to the workspace event stream (SSE over fetch so the bearer
     * token travels in a header). Returns a function that stops the stream.
     */
    subscribe: (after: number | undefined, handler: (e: EventMessage) => void, onError?: (err: unknown) => void): (() => void) => {
      const controller = new AbortController();
      const run = async () => {
        let lastId = after;
        for (;;) {
          if (controller.signal.aborted) return;
          try {
            const headers: Record<string, string> = {};
            if (lastId !== undefined) headers["Last-Event-ID"] = String(lastId);
            const res = await this.t.stream(`${this.prefix}/events`, headers, controller.signal);
            if (!res.body) throw new Error("no body");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              let idx: number;
              while ((idx = buf.indexOf("\n\n")) >= 0) {
                const chunk = buf.slice(0, idx);
                buf = buf.slice(idx + 2);
                const msg = parseSSE(chunk);
                if (msg) {
                  lastId = msg.seq;
                  handler(msg);
                }
              }
            }
          } catch (err) {
            if (controller.signal.aborted) return;
            onError?.(err);
            if (err instanceof PostwareError && (err.status === 401 || err.status === 403)) return;
            await new Promise((r) => setTimeout(r, 2000));
          }
        }
      };
      void run();
      return () => controller.abort();
    },
    /** One page of past events after a sequence number. */
    list: (after = 0, limit = 100): Promise<EventMessage[]> =>
      this.t
        .request<{ data: EventMessage[] }>(`${this.prefix}/events`, { query: { after, limit }, headers: { Accept: "application/json" } })
        .then((r) => r.data),
  };

  readonly files = {
    /** Uploads a Blob: upload-url, PUT, complete. Returns the File record. */
    upload: async (blob: Blob, opts: { name: string; mimeType?: string }): Promise<Record<string, unknown>> => {
      const mime = opts.mimeType ?? blob.type ?? "application/octet-stream";
      const start = await this.t.request<{ data: { file: Record<string, unknown>; upload_url: string; method: string; headers?: Record<string, string> } }>(
        `${this.prefix}/file/upload-url`,
        { method: "POST", body: { name: opts.name, mime_type: mime, size: blob.size } },
      );
      const { file, upload_url, method, headers } = start.data;
      const sameOrigin = upload_url.startsWith(this.baseUrl);
      const h: Record<string, string> = { ...(headers ?? {}), "Content-Type": mime };
      if (sameOrigin && this.t.token) h["Authorization"] = `Bearer ${this.t.token}`;
      const f = this.fetchImpl ?? globalThis.fetch.bind(globalThis);
      const put = await f(upload_url, { method: method || "PUT", headers: h, body: blob });
      if (!put.ok) throw await PostwareError.fromResponse(put);
      const sha256 = await digestHex(blob);
      const done = await this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/file/${encodeURIComponent(String(file["id"]))}/complete`, {
        method: "POST",
        body: { sha256 },
      });
      return done.data;
    },
    downloadUrl: (id: string): Promise<string> =>
      this.t.request<{ data: { url: string } }>(`${this.prefix}/file/${encodeURIComponent(id)}/download-url`).then((r) => r.data.url),
  };

  readonly imports = {
    run: (req: { source: "csv"; model: string; file_id: string; mapping: Record<string, unknown>; mode?: "once"; dry_run?: boolean }): Promise<Record<string, unknown>> =>
      this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/imports`, { method: "POST", body: req }).then((r) => r.data),
    get: (id: string): Promise<Record<string, unknown>> =>
      this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/imports/${encodeURIComponent(id)}`).then((r) => r.data),
  };

  readonly exports = {
    run: (req: { format: "sqlite" | "csv" | "jsonl"; models?: string[] }): Promise<Job> =>
      this.t.request<{ data: Job }>(`${this.prefix}/exports`, { method: "POST", body: req }).then((r) => r.data),
    get: (id: string): Promise<Job> => this.t.request<{ data: Job }>(`${this.prefix}/exports/${encodeURIComponent(id)}`).then((r) => r.data),
    /** Polls until the job finishes and returns it (state succeeded with download_url, or failed). */
    wait: async (id: string, opts: { intervalMs?: number; timeoutMs?: number } = {}): Promise<Job> => {
      const started = Date.now();
      for (;;) {
        const job = await this.exports.get(id);
        if (job.state === "succeeded" || job.state === "failed") return job;
        if (Date.now() - started > (opts.timeoutMs ?? 600_000)) throw new PostwareError(504, "timeout", "export did not finish in time");
        await new Promise((r) => setTimeout(r, opts.intervalMs ?? 1000));
      }
    },
  };

  readonly shares = {
    create: (share: Record<string, unknown>): Promise<{ share: Record<string, unknown>; token?: string }> =>
      this.t
        .request<{ data: Record<string, unknown>; token?: string }>(`${this.prefix}/share`, { method: "POST", body: share })
        .then((r) => ({ share: r.data, token: r.token })),
    revoke: (id: string, revision?: number): Promise<Record<string, unknown>> =>
      this.records("share" as ModelName).update(id, { status: "revoked" } as never, { ifMatch: revision, force: revision === undefined }) as unknown as Promise<Record<string, unknown>>,
  };

  readonly webhooks = {
    create: (req: { url: string; events: string[] }): Promise<Record<string, unknown>> =>
      this.t.request<{ data: Record<string, unknown> }>(`${this.prefix}/webhooks`, { method: "POST", body: req }).then((r) => r.data),
    list: (): Promise<Record<string, unknown>[]> => this.t.request<{ data: Record<string, unknown>[] }>(`${this.prefix}/webhooks`).then((r) => r.data),
    delete: (id: string): Promise<void> => this.t.request(`${this.prefix}/webhooks/${encodeURIComponent(id)}`, { method: "DELETE" }).then(() => undefined),
  };
}
export interface Postware extends ModelRecords {}

function parseSSE(chunk: string): EventMessage | null {
  let id: string | undefined;
  let event = "message";
  const dataLines: string[] = [];
  for (const line of chunk.split("\n")) {
    if (line.startsWith(":")) continue;
    const i = line.indexOf(":");
    const field = i < 0 ? line : line.slice(0, i);
    const value = i < 0 ? "" : line.slice(i + 1).replace(/^ /, "");
    if (field === "id") id = value;
    else if (field === "event") event = value;
    else if (field === "data") dataLines.push(value);
  }
  if (dataLines.length === 0) return null;
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
  } catch {
    return null;
  }
  return {
    seq: Number(id ?? data["seq"] ?? 0),
    event,
    model: data["model"] as string | undefined,
    id: data["id"] as string | undefined,
    record: data["record"] as Record<string, unknown> | undefined,
    payload: data,
  };
}

async function digestHex(blob: Blob): Promise<string | undefined> {
  const subtle = (globalThis as unknown as { crypto?: { subtle?: SubtleCrypto } }).crypto?.subtle;
  if (!subtle) return undefined;
  const buf = await subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Builds a typed ref. */
export function ref<A extends string>(model: A, id: string): Ref<A> {
  return { model, id };
}
