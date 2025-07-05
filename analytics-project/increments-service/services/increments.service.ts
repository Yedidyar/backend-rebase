import type { IncrementsRepository } from "../repositories/increments.ts";

export class IncrementsService {
  constructor(private readonly incrementsRepository: IncrementsRepository) {}

  async incrementPage(page: string, timestamp: string) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const value = 1;

    await this.incrementsRepository.incrementPage(page, date, hour, value);
  }
}
