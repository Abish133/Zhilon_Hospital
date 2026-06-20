'use strict';
// Smoke tests for the per-module RBAC matrix (pure logic, no DB).
// Verifies the GET=read / write=mutate branching and a few representative gates.
const { test } = require('node:test');
const assert = require('node:assert');
const { gateFor, gates } = require('../src/middleware/roleMatrix');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}
// Returns true if the gate called next() (i.e. allowed), false if it responded with an error.
function allows(moduleName, method, role) {
  const mw = gateFor(moduleName);
  const res = mockRes();
  let nextCalled = false;
  mw({ user: { role }, method }, res, () => { nextCalled = true; });
  return nextCalled;
}

test('gateFor throws for an unknown module (guards against typos in app.js)', () => {
  assert.throws(() => gateFor('definitelyNotAModule'), /unknown module/i);
});

test('every declared gate exposes read + write middleware', () => {
  for (const [name, gate] of Object.entries(gates)) {
    assert.strictEqual(typeof gate.read, 'function', `${name}.read`);
    assert.strictEqual(typeof gate.write, 'function', `${name}.write`);
  }
});

test('pharmacy: clinical staff can read, only Pharmacist can write', () => {
  assert.strictEqual(allows('pharmacy', 'GET', 'Doctor'), true);    // read allowed
  assert.strictEqual(allows('pharmacy', 'POST', 'Doctor'), false);  // write denied
  assert.strictEqual(allows('pharmacy', 'POST', 'Pharmacist'), true);
});

test('billing: write limited to Accountant / Receptionist', () => {
  assert.strictEqual(allows('billing', 'POST', 'Accountant'), true);
  assert.strictEqual(allows('billing', 'POST', 'Receptionist'), true);
  assert.strictEqual(allows('billing', 'POST', 'Nurse'), false);
});

test('opdConsultation: only a Doctor may write a consultation', () => {
  assert.strictEqual(allows('opdConsultation', 'POST', 'Doctor'), true);
  assert.strictEqual(allows('opdConsultation', 'POST', 'Nurse'), false);
});

test('payroll: restricted to HR for writes', () => {
  assert.strictEqual(allows('payroll', 'POST', 'HR'), true);
  assert.strictEqual(allows('payroll', 'POST', 'Accountant'), false); // Accountant reads only
});

test('admin-only modules deny all non-admin roles', () => {
  // auditLog/adminJobs are authorize([]) — nobody but Admin passes.
  for (const role of ['Doctor', 'HR', 'Accountant', 'Receptionist']) {
    assert.strictEqual(allows('auditLog', 'GET', role), false, `auditLog GET ${role}`);
    assert.strictEqual(allows('adminJobs', 'POST', role), false, `adminJobs POST ${role}`);
  }
});

test('Admin bypasses every module gate (read and write)', () => {
  assert.strictEqual(allows('pharmacy', 'POST', 'Admin'), true);
  assert.strictEqual(allows('payroll', 'POST', 'Admin'), true);
  assert.strictEqual(allows('auditLog', 'GET', 'Admin'), true);
});

test('GET uses the read gate even for a write-restricted module', () => {
  // Accountant can READ billing but the write gate also allows them; use payroll where
  // Accountant is read-only to prove the method branch matters.
  assert.strictEqual(allows('payroll', 'GET', 'Accountant'), true);   // read allowed
  assert.strictEqual(allows('payroll', 'POST', 'Accountant'), false); // write denied
});
