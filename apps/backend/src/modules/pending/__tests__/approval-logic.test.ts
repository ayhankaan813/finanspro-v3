import { describe, it, expect } from 'vitest';
import { requiresApproval } from '../pending.service.js';

describe('requiresApproval — Approval Matrix', () => {
  // ADMIN: Never needs approval
  describe('ADMIN role', () => {
    const role = 'ADMIN';
    it.each([
      'deposit', 'withdrawal', 'site-delivery', 'delivery',
      'payment', 'partner-payment', 'top-up', 'org-expense',
      'org-income', 'org-withdraw', 'financier-transfer',
      'external-debt', 'external-payment',
    ])('should NOT require approval for %s', (txType) => {
      expect(requiresApproval(role, txType)).toBe(false);
    });
  });

  // OPERATOR: Direct for deposit/withdrawal, pending for rest
  describe('OPERATOR role', () => {
    const role = 'OPERATOR';

    it('should NOT require approval for deposit', () => {
      expect(requiresApproval(role, 'deposit')).toBe(false);
    });

    it('should NOT require approval for withdrawal', () => {
      expect(requiresApproval(role, 'withdrawal')).toBe(false);
    });

    it.each([
      'site-delivery', 'delivery', 'payment', 'partner-payment',
      'top-up', 'org-expense', 'org-income', 'org-withdraw',
      'financier-transfer', 'external-debt', 'external-payment',
    ])('should require approval for %s', (txType) => {
      expect(requiresApproval(role, txType)).toBe(true);
    });
  });

  // USER (legacy): Same as OPERATOR
  describe('USER role (legacy)', () => {
    const role = 'USER';

    it('should NOT require approval for deposit', () => {
      expect(requiresApproval(role, 'deposit')).toBe(false);
    });

    it('should NOT require approval for withdrawal', () => {
      expect(requiresApproval(role, 'withdrawal')).toBe(false);
    });

    it('should require approval for site-delivery', () => {
      expect(requiresApproval(role, 'site-delivery')).toBe(true);
    });
  });

  // PARTNER: Always needs approval
  describe('PARTNER role', () => {
    const role = 'PARTNER';

    it.each([
      'deposit', 'withdrawal', 'site-delivery', 'delivery',
      'payment', 'partner-payment', 'top-up', 'org-expense',
      'org-income', 'org-withdraw', 'financier-transfer',
      'external-debt', 'external-payment',
    ])('should ALWAYS require approval for %s', (txType) => {
      expect(requiresApproval(role, txType)).toBe(true);
    });
  });

  // VIEWER: Should default to requiring approval
  describe('VIEWER role', () => {
    it('should require approval (default fallback)', () => {
      expect(requiresApproval('VIEWER', 'deposit')).toBe(true);
    });
  });

  // Unknown role: Should default to requiring approval
  describe('unknown role', () => {
    it('should default to requiring approval', () => {
      expect(requiresApproval('UNKNOWN', 'deposit')).toBe(true);
    });
  });
});
