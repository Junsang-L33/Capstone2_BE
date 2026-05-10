import { db } from "../config/db.js";

export const llmModel = {

  async getSessionMode(sessionId) {
    const result = await db.query(
      `SELECT mode FROM sessions WHERE id = $1`,
      [sessionId]
    );
    return result.rows[0]?.mode;
  },

  async getTensions(sessionId) {
    const result = await db.query(
      `SELECT type, rationale FROM tensions WHERE session_id = $1`,
      [sessionId]
    );
    return result.rows;
  },

  async getStatementsBySide(sessionId) {
    const result = await db.query(
      `SELECT speaker, text FROM statements WHERE session_id = $1`,
      [sessionId]
    );

    const aStatements = result.rows.filter(r => r.speaker === "A");
    const bStatements = result.rows.filter(r => r.speaker === "B");

    return { aStatements, bStatements };
  },
};