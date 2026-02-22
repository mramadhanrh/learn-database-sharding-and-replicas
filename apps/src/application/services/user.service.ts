import { shardManager } from "../../infrastructure/database.ts";
import type { CreateUserInput, UpdateUserInput, User } from "../../domain/user.ts";
import { randomUUID } from "crypto";

const mapRow = (row: Record<string, unknown>): User => ({
  id: row.id as string,
  email: row.email as string,
  name: row.name as string,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

export class UserService {
  /**
   * Create a user.
   * 1. Generate UUID → deterministic shard index
   * 2. INSERT on that shard's writer pool
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const id = randomUUID();
    const writer = shardManager.getWriter(id);
    const now = new Date();

    const result = await writer.query(
      `INSERT INTO users (id, email, name, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, created_at, updated_at`,
      [id, input.email, input.name, now, now],
    );

    return mapRow(result.rows[0]);
  }

  /**
   * Get user by ID → route to the correct shard's reader pool.
   */
  async getUserById(id: string): Promise<User | null> {
    const reader = shardManager.getReader(id);

    const result = await reader.query(
      `SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapRow(result.rows[0]);
  }

  /**
   * Update user → route to the correct shard's writer pool.
   */
  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    const writer = shardManager.getWriter(id);
    const now = new Date();
    const fields: string[] = [];
    const values: (string | Date)[] = [];
    let paramIndex = 1;

    if (input.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(input.email);
      paramIndex++;
    }

    if (input.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(input.name);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    fields.push(`updated_at = $${paramIndex}`);
    values.push(now);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex + 1} 
                   RETURNING id, email, name, created_at, updated_at`;

    const result = await writer.query(query, [...values, id]);

    if (result.rows.length === 0) {
      return null;
    }

    return mapRow(result.rows[0]);
  }

  /**
   * Delete user → route to the correct shard's writer pool.
   */
  async deleteUser(id: string): Promise<boolean> {
    const writer = shardManager.getWriter(id);

    const result = await writer.query(`DELETE FROM users WHERE id = $1`, [id]);

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get all users → scatter-gather across ALL shard readers,
   * merge results, and sort by created_at DESC.
   */
  async getAllUsers(): Promise<User[]> {
    const queries: Promise<User[]>[] = [];

    for (let i = 0; i < shardManager.shardCount; i++) {
      const reader = shardManager.getReaderByIndex(i);

      const promise = reader
        .query(`SELECT id, email, name, created_at, updated_at FROM users ORDER BY created_at DESC`)
        .then((result) => result.rows.map(mapRow));

      queries.push(promise);
    }

    const shardResults = await Promise.all(queries);
    const allUsers = shardResults.flat();

    // Merge-sort across shards: most recent first
    allUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allUsers;
  }
}

export const userService = new UserService();
