import type { IncrementsRepository } from "../repositories/increments.ts";

export class IncrementsService {
  constructor(private readonly incrementsRepository: IncrementsRepository) {}

  async incrementPage(page: string, timestamp: string) {
    const date = new Date(timestamp);
    const hour = date.getUTCHours();
    const value = 1;

    const dateOnly = date.toISOString().split("T")[0];
    const dateOnlyObj = new Date(dateOnly + "T00:00:00.000Z");

    await this.incrementsRepository.incrementPage(
      page,
      dateOnlyObj,
      hour,
      value,
    );
  }

  async incrementMultiplePages(
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

        if (isNaN(date.getTime())) {
          throw new Error(
            `Invalid time format: ${timeKey}. Expected format: ISO 8601 timestamp`,
          );
        }

        const hour = date.getUTCHours();

        increments.push({
          page,
          date,
          hour,
          value,
        });
      }
    }

    const groupedIncrements = increments.reduce(
      (acc, increment) => {
        const dateOnly = increment.date.toISOString().split("T")[0];
        const key = `${increment.page}-${dateOnly}-${increment.hour}`;
        if (acc[key]) {
          acc[key].value += increment.value;
        } else {
          const dateOnlyObj = new Date(dateOnly + "T00:00:00.000Z");
          acc[key] = {
            ...increment,
            date: dateOnlyObj,
          };
        }
        return acc;
      },
      {} as Record<string, (typeof increments)[number]>,
    );

    await this.incrementsRepository.incrementMultiplePages(
      Object.values(groupedIncrements),
    );
  }
}
