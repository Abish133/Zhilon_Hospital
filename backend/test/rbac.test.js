'use strict';
// Smoke tests for the RBAC primitives (pure logic, no DB).
// Run with: npm test   (uses Node's built-in test runner)
const { test } = require('node:test');
const assert = require('node:assert');
const { authorize, enforceHospitalScope, normalizeRole } = require('../src/middleware/rbac');

// Minimal Express req/res/next doubles.
function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}
function run(mw, req) {
  const res = mockRes();
  let nextCalled = false;
  mw(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
}

test('normalizeRole maps case/alias variants to canonical role', () => {
  assert.strictEqual(normalizeRole('doctor'), 'Doctor');
  assert.strictEqual(normalizeRole('LAB TECH'), 'LabTech');
  assert.strictEqual(normalizeRole('HR'), 'HR');
  assert.strictEqual(normalizeRole(''), '');
  assert.strictEqual(normalizeRole(undefined), '');
});

test('authorize: 401 when no authenticated user', () => {
  const { res, nextCalled } = run(authorize('Doctor'), {});
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(nextCalled, false);
});

test('authorize: 403 when user has no role', () => {
  const { res, nextCalled } = run(authorize('Doctor'), { user: {} });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

test('authorize: Admin bypasses every gate', () => {
  const { res, nextCalled } = run(authorize('Doctor'), { user: { role: 'Admin' } });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(res.statusCode, 200);
});

test('authorize: allowed role passes (case-insensitive)', () => {
  const { nextCalled } = run(authorize('Doctor', 'Nurse'), { user: { role: 'doctor' } });
  assert.strictEqual(nextCalled, true);
});

test('authorize: disallowed role is denied with 403', () => {
  const { res, nextCalled } = run(authorize('Doctor', 'Nurse'), { user: { role: 'Pharmacist' } });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

test('authorize: accepts an array of roles', () => {
  const { nextCalled } = run(authorize(['Accountant', 'Receptionist']), { user: { role: 'Receptionist' } });
  assert.strictEqual(nextCalled, true);
});

test('enforceHospitalScope: 403 when user has no hospital', () => {
  const { res, nextCalled } = run(enforceHospitalScope, { user: { role: 'Doctor' }, method: 'GET', query: {} });
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(nextCalled, false);
});

test('enforceHospitalScope: GET injects hospital_id into query and preserves existing params', () => {
  const req = { user: { role: 'Doctor', hospital_id: 7 }, method: 'GET', query: { status: 'Available' } };
  const { nextCalled } = run(enforceHospitalScope, req);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.hospitalId, 7);
  assert.strictEqual(req.query.hospital_id, 7);
  assert.strictEqual(req.query.status, 'Available');
});

test('enforceHospitalScope: POST forces hospital_id into body', () => {
  const req = { user: { role: 'Doctor', hospital_id: 9 }, method: 'POST', body: { first_name: 'A' } };
  const { nextCalled } = run(enforceHospitalScope, req);
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.body.hospital_id, 9);
});

test('enforceHospitalScope: a client cannot spoof another hospital on POST', () => {
  const req = { user: { role: 'Doctor', hospital_id: 1 }, method: 'POST', body: { hospital_id: 999 } };
  run(enforceHospitalScope, req);
  assert.strictEqual(req.body.hospital_id, 1); // overridden from the token, not trusted from body
});
