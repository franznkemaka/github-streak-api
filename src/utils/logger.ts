import path from 'path';
import winston from 'winston';

const logConfiguration = {
  transports: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs/api.log'),
      maxsize: 1e7,
    }),
  ],
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss',
    }),
    winston.format.printf(
      (info) => `${info.level.toUpperCase()}: ${[info.timestamp]}: ${info.message}`,
    ),
  ),
};

export default winston.createLogger(logConfiguration);
