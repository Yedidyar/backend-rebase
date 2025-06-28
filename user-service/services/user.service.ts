import type { UserDto, UserRepository } from "../repositories/users.ts";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  getUser(id: string) {
    return this.userRepository.getUser(id);
  }

  createOrUpdateUser(user: UserDto) {
    return this.userRepository.upsert(user);
  }

  deleteUser(id: string) {
    return this.userRepository.delete(id);
  }
}
