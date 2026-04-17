import { db } from "../config/db.js";

export const authModel = {
  async findById(id) {
    const query = `
      SELECT id, provider, provider_user_id, email, name, picture_url, gender, age, created_at, last_login_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  },

  async findByProviderUserId(provider, providerUserId) {
    const query = `
      SELECT id, provider, provider_user_id, email, name, picture_url, gender, age, created_at, last_login_at
      FROM users
      WHERE provider = $1 AND provider_user_id = $2
      LIMIT 1
    `;

    const result = await db.query(query, [provider, providerUserId]);
    return result.rows[0] || null;
  },

  async createGoogleUser(payload) {
    const query = `
      INSERT INTO users (
        provider,
        provider_user_id,
        email,
        name,
        picture_url,
        gender,
        age,
        created_at,
        last_login_at
      )
      VALUES (
        'google',
        $1,
        $2,
        $3,
        $4,
        NULL,
        NULL,
        NOW(),
        NOW()
      )
      RETURNING id, provider, provider_user_id, email, name, picture_url, gender, age, created_at, last_login_at
    `;

    const result = await db.query(query, [
      payload.providerUserId,
      payload.email,
      payload.name,
      payload.pictureUrl,
    ]);

    return result.rows[0] || null;
  },

  async updateGoogleLoginProfile(userId, payload) {
    const query = `
      UPDATE users
      SET
        email = $2,
        name = $3,
        picture_url = $4,
        last_login_at = NOW()
      WHERE id = $1
      RETURNING id, provider, provider_user_id, email, name, picture_url, gender, age, created_at, last_login_at
    `;

    const result = await db.query(query, [
      userId,
      payload.email,
      payload.name,
      payload.pictureUrl,
    ]);

    return result.rows[0] || null;
  },
};

