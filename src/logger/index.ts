import winston from "winston";
import LogzioWinstonTransport from "winston-logzio";
const logzioWinstonTransport = new LogzioWinstonTransport({
  level: "info",
  name: "winston_logzio",
  token: process.env.LOGZIO_TOKEN!,
  host: "listener-eu.logz.io",
});

export const logger = winston.createLogger({
  format: winston.format.simple(),
  transports: [logzioWinstonTransport],
});
