const express = require('express');
const router = express.Router();
const {
  getPeople,
  getBalances,
  getSettlements
} = require('../controllers/settlementControllerClean');

// GET /people - Get all people derived from expenses
router.get('/people', getPeople);

// GET /balances - Get balances for all people
router.get('/balances', getBalances);

// GET /settlements - Get settlement summary
router.get('/settlements', getSettlements);

module.exports = router;