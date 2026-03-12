import { describe, it, expect } from 'vitest';
import {
  AppError,
  BusinessError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InsufficientBalanceError,
  LedgerImbalanceError,
  ApprovalRequiredError,
} from '../errors.js';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create with default values', () => {
      const err = new AppError('test error');
      expect(err.message).toBe('test error');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('INTERNAL_ERROR');
      expect(err.isOperational).toBe(true);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('should create with custom status and code', () => {
      const err = new AppError('custom', 422, 'CUSTOM_ERROR');
      expect(err.statusCode).toBe(422);
      expect(err.code).toBe('CUSTOM_ERROR');
    });
  });

  describe('BusinessError', () => {
    it('should have status 400', () => {
      const err = new BusinessError('İşlem yapılamadı');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BUSINESS_ERROR');
      expect(err.message).toBe('İşlem yapılamadı');
    });

    it('should accept custom code', () => {
      const err = new BusinessError('msg', 'CUSTOM_BIZ');
      expect(err.code).toBe('CUSTOM_BIZ');
    });
  });

  describe('ValidationError', () => {
    it('should have status 400 and errors record', () => {
      const errors = { amount: ['must be positive'], site_id: ['required'] };
      const err = new ValidationError('Validation failed', errors);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.errors).toEqual(errors);
    });

    it('should default to empty errors', () => {
      const err = new ValidationError('bad input');
      expect(err.errors).toEqual({});
    });
  });

  describe('AuthenticationError', () => {
    it('should have status 401', () => {
      const err = new AuthenticationError();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe('AUTHENTICATION_ERROR');
      expect(err.message).toBe('Authentication required');
    });

    it('should accept custom message', () => {
      const err = new AuthenticationError('Token expired');
      expect(err.message).toBe('Token expired');
    });
  });

  describe('AuthorizationError', () => {
    it('should have status 403', () => {
      const err = new AuthorizationError();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('NotFoundError', () => {
    it('should have status 404 with resource name', () => {
      const err = new NotFoundError('Financier');
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Financier not found');
    });

    it('should include id when provided', () => {
      const err = new NotFoundError('Site', 'abc-123');
      expect(err.message).toBe("Site with id 'abc-123' not found");
    });
  });

  describe('ConflictError', () => {
    it('should have status 409', () => {
      const err = new ConflictError('Duplicate entry');
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });
  });

  describe('InsufficientBalanceError', () => {
    it('should contain balance info', () => {
      const err = new InsufficientBalanceError('5000', '10000');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('INSUFFICIENT_BALANCE');
      expect(err.available).toBe('5000');
      expect(err.required).toBe('10000');
      expect(err.message).toContain('5000');
      expect(err.message).toContain('10000');
    });
  });

  describe('LedgerImbalanceError', () => {
    it('should be a critical 500 error', () => {
      const err = new LedgerImbalanceError('10000', '9990');
      expect(err.statusCode).toBe(500);
      expect(err.code).toBe('LEDGER_IMBALANCE');
      expect(err.debitTotal).toBe('10000');
      expect(err.creditTotal).toBe('9990');
    });
  });

  describe('ApprovalRequiredError', () => {
    it('should contain approval ID', () => {
      const err = new ApprovalRequiredError('apr-123');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('APPROVAL_REQUIRED');
      expect(err.approvalId).toBe('apr-123');
    });
  });
});
