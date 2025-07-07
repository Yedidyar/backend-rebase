import type { IncrementsRepository } from "../repositories/increments.ts";

export class IncrementsService {
  constructor(private readonly incrementsRepository: IncrementsRepository) {}

  async incrementPage(page: string, timestamp: string): Promise<void> {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    const value = 1;

    await this.incrementsRepository.incrementPage(
      page.trim(),
      date,
      hour,
      value,
    );
  }

  async incrementMultiplePages(
    pageData: Record<string, Record<string, number>>,
  ): Promise<void> {
    const increments = this.parsePageIncrements(pageData);
    const groupedIncrements = this.groupIncrements(increments);

    await this.incrementsRepository.incrementMultiplePages(
      Object.values(groupedIncrements),
    );
  }

  private parsePageIncrements(
    pageData: Record<string, Record<string, number>>,
  ) {
    const increments: Array<{
      page: string;
      date: Date;
      hour: number;
      value: number;
    }> = [];

    for (const [page, timeData] of Object.entries(pageData)) {
      for (const [timeKey, value] of Object.entries(timeData)) {
        const date = new Date(timeKey);
        const hour = date.getUTCHours();

        increments.push({
          page: page.trim(),
          date,
          hour,
          value,
        });
      }
    }

    return increments;
  }

  private groupIncrements(
    increments: Array<{
      page: string;
      date: Date;
      hour: number;
      value: number;
    }>,
  ) {
    const groupedIncrements = increments.reduce(
      (acc, increment) => {
        const dateKey = increment.date.toISOString().split("T")[0];
        const key = `${increment.page}:${dateKey}:${increment.hour}`;

        if (acc[key]) {
          acc[key].value += increment.value;
        } else {
          acc[key] = increment;
        }
        return acc;
      },
      {} as Record<string, (typeof increments)[number]>,
    );

    return groupedIncrements;
  }
}
