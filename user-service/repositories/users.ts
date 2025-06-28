
import { Pool } from "pg";
import { logger } from '../index.ts';
import { pool } from './pool.ts'


export interface UserDto {
    id: string;
    email: string;
    full_name: string;
    joined_at: Date;
    deleted_at?: Date | null;
}

export class UserRepository {
    #pool: Pool;
    constructor() {
        this.#pool = pool;
    }

    async #getSession() {
        const session = await this.#pool.connect();
        session.connect();
        return {
            session,
            [Symbol.asyncDispose]: async () => {
                session.release();
            },
        };
    }

    async upsert(user: UserDto) {
        const action = 'UPSERT USER';
        const upsertQuery = `
        INSERT INTO users (id, email, full_name, joined_at, deleted_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email) 
        DO UPDATE SET
          email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          deleted_at = EXCLUDED.deleted_at
        RETURNING id, name, email, full_name, joined_at, 
            (users.deleted_at is NULL) as already_exists, 
            (xmax = 0) as is_insert;
      `;
        await using session = await this.#getSession();
        const { rows } = await session.session.query(upsertQuery, [
            user.id,
            user.email,
            user.full_name,
            user.joined_at,
            null,
        ]);

        const { id, full_name, email, joined_at, already_exists, is_insert } = rows[0];

        if (is_insert) {
            logger.info({ action, userId: id, message: 'new user was created' })
        } else if (already_exists) {
            logger.info({ action, userId: id, message: 'user is already active' })
        } else {
            logger.info({ action, userId: id, message: 'user was reactivated' })
        }
        return { full_name, email, joined_at }
    }
}