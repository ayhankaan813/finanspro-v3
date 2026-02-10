/**
 * Base error class for application errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Business logic errors (400)
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR') {
    super(message, 400, code);
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Insufficient balance error
 */
export class InsufficientBalanceError extends BusinessError {
  public readonly available: string;
  public readonly required: string;

  constructor(available: string, required: string) {
    super(`Insufficient balance. Available: ${available}, Required: ${required}`, 'INSUFFICIENT_BALANCE');
    this.available = available;
    this.required = required;
  }
}

/**
 * Ledger imbalance error (critical)
 */
export class LedgerImbalanceError extends AppError {
  public readonly debitTotal: string;
  public readonly creditTotal: string;

  constructor(debitTotal: string, creditTotal: string) {
    super(
      `Critical: Ledger imbalance detected. Debit: ${debitTotal}, Credit: ${creditTotal}`,
      500,
      'LEDGER_IMBALANCE'
    );
    this.debitTotal = debitTotal;
    this.creditTotal = creditTotal;
  }
}

/**
 * Approval required error
 */
export class ApprovalRequiredError extends BusinessError {
  public readonly approvalId: string;

  constructor(approvalId: string, message: string = 'This operation requires approval') {
    super(message, 'APPROVAL_REQUIRED');
    this.approvalId = approvalId;
  }
}
