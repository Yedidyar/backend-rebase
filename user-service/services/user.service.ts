import { uuidv7 } from "uuidv7";
import type { UserDto } from "../repositories/users.ts";
import { UserRepository, upserUserAction } from "../repositories/users.ts";
import { logger } from "../index.ts";

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
      logger.error({
        action: upserUserAction,
        message: "Couldn't save user",
        cause: (err as Error)?.cause,
      });
    }
  }
}
