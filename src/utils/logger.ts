import pino from 'pino'

const logger = pino({
  level: 'info', // Adjust the log level as needed
  transport: {
    target: 'pino-pretty', // Pretty print logs in development
    options: {
      colorize: true,
    },
  },
})

export default logger
