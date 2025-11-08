import logger from './logger'

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const retry = async <T>(fn: () => Promise<T> | T, maxRetries = 5, baseDelayMs = 1000): Promise<T> => {
  const attempt = async (retriesLeft: number, attemptNumber: number): Promise<T> => {
    try {
      return await fn()
    } catch (error) {
      if (retriesLeft <= 0) {
        throw new Error(`Failed to execute function after ${maxRetries} retries: ${formatError(error)}`)
      }
      // First retry is instant, subsequent retries use exponential backoff
      const delayMs = attemptNumber === 1 ? 0 : baseDelayMs * Math.pow(2, attemptNumber - 2)

      logger.error(
        `Failed to execute function (attempt ${attemptNumber}/${maxRetries}), retrying in ${delayMs}ms... Error: ${formatError(error)}`,
      )

      await sleep(delayMs)
      return attempt(retriesLeft - 1, attemptNumber + 1)
    }
  }

  return attempt(maxRetries, 1)
}

// Helper function to properly format errors for logging
const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error)
    } catch {
      return '[object]'
    }
  }
  return String(error)
}
