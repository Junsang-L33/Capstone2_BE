import { db } from "../config/db.js";

export const profileModel = {
  async findById(userId) {
    const query = `
      SELECT id, provider, provider_user_id, email, name, picture_url, gender, age, created_at, last_login_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  },

  async updateProfile(userId, payload) {
    const updates = [];
    const values = [userId];

    if (Object.prototype.hasOwnProperty.call(payload, "gender")) {
      values.push(payload.gender);
      updates.push(`gender = $${values.length}`);
    }

    if (Object.prototype.hasOwnProperty.call(payload, "age")) {
      values.push(payload.age);
      updates.push(`age = $${values.length}`);
    }

    if (updates.length === 0) {
      return null;
    }

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING id, provider, provider_user_id, email, name, picture_url, gender, age, created_at, last_login_at
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  },
};

