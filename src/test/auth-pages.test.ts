import { expect, test } from 'vitest';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

test('ForgotPassword page exports correctly', () => {
    expect(ForgotPassword).toBeDefined();
});

test('ResetPassword page exports correctly', () => {
    expect(ResetPassword).toBeDefined();
});
