import winston from "winston";
import LogzioWinstonTransport from "winston-logzio";
const logzioWinstonTransport = new LogzioWinstonTransport({
  level: "info",
  name: "winston_logzio",
  token: process.env.LOGZIO_TOKEN!,
  host: process.env.LISTENER_URL,
  
});

export const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [
    logzioWinstonTransport,
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
