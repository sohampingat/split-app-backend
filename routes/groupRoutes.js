const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroup,
  addMember,
  removeMember,
  updateGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { validateGroup } = require('../middleware/validation');

// @route   POST /api/groups
// @desc    Create new group
// @access  Private
router.post('/', protect, validateGroup, createGroup);

// @route   GET /api/groups
// @desc    Get all user's groups
// @access  Private
router.get('/', protect, getGroups);

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', protect, getGroup);

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private
router.put('/:id', protect, updateGroup);

// @route   POST /api/groups/:id/members
// @desc    Add member to group
// @access  Private
router.post('/:id/members', protect, addMember);

// @route   DELETE /api/groups/:id/members/:memberId
// @desc    Remove member from group
// @access  Private
router.delete('/:id/members/:memberId', protect, removeMember);

module.exports = router;