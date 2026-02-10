import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { isProd } from '../../config/index.js';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  // Log error
  logger.error({
    err: error,
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          errors: error.flatten().fieldErrors,
        },
      },
    };
    reply.status(400).send(response);
    return;
  }

  // Handle application errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details:
          error instanceof ValidationError
            ? { errors: error.errors }
            : undefined,
      },
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle Fastify errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code || 'FASTIFY_ERROR',
        message: error.message,
      },
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd ? 'Internal server error' : error.message,
      details: isProd ? undefined : { stack: error.stack },
    },
  };
  reply.status(500).send(response);
}
