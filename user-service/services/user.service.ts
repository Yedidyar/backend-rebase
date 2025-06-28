import { uuidv7 } from "uuidv7";
import type { UserDto } from "../repositories/users.ts";
import { UserRepository, upsertUserAction } from "../repositories/users.ts";
import { logger } from "../index.ts";

export class UpsertError extends Error {
  action: string;
  constructor() {
    super();
    this.action = upsertUserAction;
  }
}

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  getUser(id: string) {
    return this.userRepository.getUser(id);
  }

  async createOrUpdateUser(email: string, fullName: string) {
    const joinedAt = new Date();
    const userToSave: UserDto = {
      id: uuidv7(),
      full_name: fullName,
      email,
      joined_at: joinedAt,
    };
    try {
      const user = await this.userRepository.upsert(userToSave);
      return user;
    } catch (err) {
      throw new UpsertError();
    }
  }
}
