import { describe, it, expect } from 'vitest';

/**
 * Business logic unit tests.
 * Tests the core calculations and rules from the spec WITHOUT database.
 */

// FR-031: Auto-pricing formula
function calculatePrice(quantity: number, rate: number): number {
    return Math.floor(quantity * rate * 100) / 100;
}

// FR-033: Valid status transitions
const VALID_TRANSITIONS: Record<string, string> = {
    RECEIVED: 'PROCESSING',
    PROCESSING: 'COMPLETED',
    COMPLETED: 'DELIVERED',
};

function canTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from] === to;
}

// FR-046: Template variable substitution
function substituteTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
    }
    return result;
}

describe('Business Logic', () => {
    describe('Auto-Pricing (FR-031)', () => {
        it('should calculate simple integer pricing', () => {
            expect(calculatePrice(5, 10)).toBe(50);
        });

        it('should handle decimal quantities and rates', () => {
            // 3.5 kg × €4.50/kg = €15.75
            expect(calculatePrice(3.5, 4.5)).toBe(15.75);
        });

        it('should floor to 2 decimal places (not round)', () => {
            // 1.333 × 3.00 = 3.999 → floor → 3.99 (not 4.00)
            expect(calculatePrice(1.333, 3.0)).toBe(3.99);
        });

        it('should handle very small amounts', () => {
            // 0.1 × 0.1 = 0.01
            expect(calculatePrice(0.1, 0.1)).toBe(0.01);
        });

        it('should return 0 for zero quantity', () => {
            expect(calculatePrice(0, 10)).toBe(0);
        });

        it('should return 0 for zero rate', () => {
            expect(calculatePrice(5, 0)).toBe(0);
        });

        it('should handle large numbers', () => {
            // 999.999 × 999.99 = 999989.00001 → floor → 999989.00
            expect(calculatePrice(999.999, 999.99)).toBe(999989);
        });

        it('should prevent floating point errors', () => {
            // Classic JS: 0.1 + 0.2 = 0.30000000000000004
            // Our formula: floor(2.1 × 3.0 × 100) / 100 = floor(630) / 100 = 6.30
            expect(calculatePrice(2.1, 3.0)).toBe(6.3);
        });
    });

    describe('Status Transitions (FR-033)', () => {
        it('should allow RECEIVED → PROCESSING', () => {
            expect(canTransition('RECEIVED', 'PROCESSING')).toBe(true);
        });

        it('should allow PROCESSING → COMPLETED', () => {
            expect(canTransition('PROCESSING', 'COMPLETED')).toBe(true);
        });

        it('should allow COMPLETED → DELIVERED', () => {
            expect(canTransition('COMPLETED', 'DELIVERED')).toBe(true);
        });

        it('should NOT allow backward: PROCESSING → RECEIVED', () => {
            expect(canTransition('PROCESSING', 'RECEIVED')).toBe(false);
        });

        it('should NOT allow backward: COMPLETED → PROCESSING', () => {
            expect(canTransition('COMPLETED', 'PROCESSING')).toBe(false);
        });

        it('should NOT allow backward: DELIVERED → anything', () => {
            expect(canTransition('DELIVERED', 'RECEIVED')).toBe(false);
            expect(canTransition('DELIVERED', 'PROCESSING')).toBe(false);
            expect(canTransition('DELIVERED', 'COMPLETED')).toBe(false);
        });

        it('should NOT allow skipping: RECEIVED → COMPLETED', () => {
            expect(canTransition('RECEIVED', 'COMPLETED')).toBe(false);
        });

        it('should NOT allow skipping: RECEIVED → DELIVERED', () => {
            expect(canTransition('RECEIVED', 'DELIVERED')).toBe(false);
        });

        it('should NOT allow same-state transition', () => {
            expect(canTransition('RECEIVED', 'RECEIVED')).toBe(false);
        });
    });

    describe('Template Substitution (FR-046)', () => {
        it('should replace [customer_name]', () => {
            const result = substituteTemplate(
                'Hello [customer_name], your order is ready.',
                { customer_name: 'John' }
            );
            expect(result).toBe('Hello John, your order is ready.');
        });

        it('should replace multiple variables', () => {
            const result = substituteTemplate(
                'Hi [customer_name], your order total is €[amount]. Delivery: [date].',
                { customer_name: 'Alice', amount: '45.00', date: '2026-03-10' }
            );
            expect(result).toBe('Hi Alice, your order total is €45.00. Delivery: 2026-03-10.');
        });

        it('should replace multiple occurrences of same variable', () => {
            const result = substituteTemplate(
                'Dear [customer_name], thank you [customer_name]!',
                { customer_name: 'Bob' }
            );
            expect(result).toBe('Dear Bob, thank you Bob!');
        });

        it('should leave unmatched variables intact', () => {
            const result = substituteTemplate(
                'Hello [customer_name], ref: [order_id]',
                { customer_name: 'Eve' }
            );
            expect(result).toBe('Hello Eve, ref: [order_id]');
        });

        it('should handle empty template', () => {
            const result = substituteTemplate('', { customer_name: 'Test' });
            expect(result).toBe('');
        });
    });

    describe('Follow-up Detection (FR-071)', () => {
        function isDueForFollowup(lastJobDate: Date | null, thresholdDays: number): boolean {
            if (!lastJobDate) return true;
            const threshold = new Date();
            threshold.setDate(threshold.getDate() - thresholdDays);
            return lastJobDate < threshold;
        }

        it('should flag customer with no jobs', () => {
            expect(isDueForFollowup(null, 30)).toBe(true);
        });

        it('should flag customer whose last job was 31 days ago', () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 31);
            expect(isDueForFollowup(oldDate, 30)).toBe(true);
        });

        it('should NOT flag customer whose last job was yesterday', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(isDueForFollowup(yesterday, 30)).toBe(false);
        });

        it('should respect configurable threshold', () => {
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
            // With 30-day threshold, NOT due
            expect(isDueForFollowup(fifteenDaysAgo, 30)).toBe(false);
            // With 10-day threshold, IS due
            expect(isDueForFollowup(fifteenDaysAgo, 10)).toBe(true);
        });
    });
});
