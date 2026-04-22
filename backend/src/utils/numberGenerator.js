'use strict';

const { Op } = require('sequelize');

/**
 * Look up a per-hospital prefix override from Hospital.numbering_prefixes JSON.
 * Returns defaultPrefix if not set.
 */
async function getHospitalPrefix(hospitalId, entityKey, defaultPrefix) {
  if (!hospitalId || !entityKey) return defaultPrefix;
  try {
    const { Hospital } = require('../models');
    const h = await Hospital.findByPk(hospitalId, { attributes: ['numbering_prefixes'] });
    const cfg = h && h.numbering_prefixes;
    if (cfg && typeof cfg === 'object' && cfg[entityKey]) return String(cfg[entityKey]);
  } catch (e) { /* ignore — fall back */ }
  return defaultPrefix;
}

/**
 * Atomically generate a sequential number in format PREFIX-YYYY-00001
 * Requires an active transaction and locks matching rows to prevent duplicates.
 *
 * @param {object} opts
 * @param {Model} opts.model - Sequelize model
 * @param {string} opts.field - Column holding the number (e.g. 'bill_number')
 * @param {string} opts.prefix - Prefix segment (e.g. 'BILL')
 * @param {number} [opts.hospitalId] - Scope to hospital_id
 * @param {Transaction} opts.transaction - Sequelize transaction
 * @param {number} [opts.pad=5] - Zero-pad width
 * @returns {Promise<string>} generated number
 */
async function generateSequentialNumber({ model, field, prefix, hospitalId, transaction, pad = 5 }) {
  if (!transaction) throw new Error('generateSequentialNumber requires a transaction');

  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;
  const where = { [field]: { [Op.like]: pattern } };
  if (hospitalId) where.hospital_id = hospitalId;

  const last = await model.findOne({
    where,
    order: [[field, 'DESC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  let next = 1;
  if (last && last[field]) {
    const parts = String(last[field]).split('-');
    const n = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(n)) next = n + 1;
  }

  return `${prefix}-${year}-${String(next).padStart(pad, '0')}`;
}

module.exports = { generateSequentialNumber, getHospitalPrefix };
