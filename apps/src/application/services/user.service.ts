import { getDatabase } from "../../infrastructure/database.ts";
import { CreateUserInput, UpdateUserInput, User } from "../../domain/user.ts";
import { randomUUID } from "crypto";

export class UserService {
  async createUser(input: CreateUserInput): Promise<User> {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date();

    const result = await db.query(
      `INSERT INTO users (id, email, name, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, created_at, updated_at`,
      [id, input.email, input.name, now, now],
    );

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const db = getDatabase();

    const result = await db.query(
      `SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User | null> {
    const db = getDatabase();
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

    const result = await db.query(query, [...values, id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async deleteUser(id: string): Promise<boolean> {
    const db = getDatabase();

    const result = await db.query(`DELETE FROM users WHERE id = $1`, [id]);

    return result.rowCount > 0;
  }

  async getAllUsers(): Promise<User[]> {
    const db = getDatabase();

    const result = await db.query(
      `SELECT id, email, name, created_at, updated_at FROM users ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }
}

export const userService = new UserService();
