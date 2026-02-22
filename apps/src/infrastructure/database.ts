import pkg from "pg";
import { config, type ShardConfig } from "../config/env.ts";

const { Pool } = pkg;

// ─── Types ──────────────────────────────────────────────────────────────────

interface Shard {
  index: number;
  writerPool: pkg.Pool;
  readerPools: pkg.Pool[];
}

// ─── Shard Manager ──────────────────────────────────────────────────────────

class ShardManager {
  private shards: Shard[] = [];
  private initialized = false;

  /**
   * Create connection pools for all configured shards.
   * Each shard gets one writer pool and one reader pool per read host.
   */
  initialize(): void {
    if (this.initialized) return;

    for (let i = 0; i < config.shards.length; i++) {
      const cfg = config.shards[i] as ShardConfig;

      const writerPool = new Pool({
        host: cfg.writeHost,
        port: cfg.port,
        user: cfg.user,
        password: cfg.password,
        database: cfg.database,
      });

      writerPool.on("error", (err) => {
        console.error(`[shard-${i} writer] Unexpected error on idle client`, err);
      });

      const readerPools = cfg.readHosts.map((readHost, ri) => {
        const rPool = new Pool({
          host: readHost,
          port: cfg.port,
          user: cfg.user,
          password: cfg.password,
          database: cfg.database,
        });

        rPool.on("error", (err) => {
          console.error(`[shard-${i} reader-${ri}] Unexpected error on idle client`, err);
        });

        return rPool;
      });

      this.shards.push({ index: i, writerPool, readerPools });
    }

    this.initialized = true;
    console.log(`✓ ShardManager initialized with ${this.shards.length} shard(s)`);
    for (const s of this.shards) {
      console.log(`  shard-${s.index}: writer + ${s.readerPools.length} reader(s)`);
    }
  }

  /**
   * Deterministic shard routing: parse the first 8 hex chars of a UUID
   * and modulo by shard count.
   */
  getShardIndex(id: string): number {
    const hex = id.replace(/-/g, "").slice(0, 8);
    const num = parseInt(hex, 16);
    return num % this.shards.length;
  }

  /** Get the writer pool for the shard that owns the given ID. */
  getWriter(id: string): pkg.Pool {
    this.ensureInitialized();
    const idx = this.getShardIndex(id);
    return (this.shards[idx] as Shard).writerPool;
  }

  /** Get a reader pool for the shard that owns the given ID (round-robin). */
  getReader(id: string): pkg.Pool {
    this.ensureInitialized();
    const idx = this.getShardIndex(id);
    const shard = this.shards[idx] as Shard;
    // Simple round-robin among readers
    const readerIdx = Math.floor(Math.random() * shard.readerPools.length);
    return shard.readerPools[readerIdx] as pkg.Pool;
  }

  /** Get the writer pool for a specific shard index. */
  getWriterByIndex(shardIndex: number): pkg.Pool {
    this.ensureInitialized();
    return (this.shards[shardIndex] as Shard).writerPool;
  }

  /** Get a reader pool for a specific shard index. */
  getReaderByIndex(shardIndex: number): pkg.Pool {
    this.ensureInitialized();
    const shard = this.shards[shardIndex] as Shard;
    const readerIdx = Math.floor(Math.random() * shard.readerPools.length);
    return shard.readerPools[readerIdx] as pkg.Pool;
  }

  /** Total number of shards. */
  get shardCount(): number {
    return this.shards.length;
  }

  /** Close all pools. */
  async closeAll(): Promise<void> {
    const tasks: Promise<void>[] = [];

    for (const shard of this.shards) {
      tasks.push(shard.writerPool.end());
      for (const rPool of shard.readerPools) {
        tasks.push(rPool.end());
      }
    }

    await Promise.all(tasks);
    this.shards = [];
    this.initialized = false;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("ShardManager not initialized. Call initialize() first.");
    }
  }
}

// ─── Singleton ──────────────────────────────────────────────────────────────

export const shardManager = new ShardManager();
