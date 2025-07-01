import winston from "winston";
import LogzioWinstonTransport from "winston-logzio";

const logzioWinstonTransport = new LogzioWinstonTransport({
  level: "info",
  name: "winston_logzio",
  token: process.env.LOGZIO_TOKEN!,
  host: process.env.LISTENER_URL,
});

export const createLogger = (serviceName: string) => {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.metadata(),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      logzioWinstonTransport,
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level}]: ${JSON.stringify(message, null, 2)} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`;
          }),
        ),
      }),
    ],
  });
};
