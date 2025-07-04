export const config = {
  PORT: parseInt(process.env.PORT!),
  CONNECTION_STRING: process.env.CONNECTION_STRING!,
} as const;
