const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const Expense = require('../models/Expense');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, description, avatar, members } = req.body;
    const userId = req.user.id;

    // Create group
    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      avatar: avatar || '',
      createdBy: userId,
      members: [{
        user: userId,
        role: 'admin'
      }]
    });

    // Add additional members if provided
    if (members && Array.isArray(members)) {
      for (const memberEmail of members) {
        const user = await User.findOne({ email: memberEmail.toLowerCase() });
        if (user && user._id.toString() !== userId) {
          group.members.push({
            user: user._id,
            role: 'member'
          });
        }
      }
    }

    await group.save();

    // Update users' groups array
    const memberIds = group.members.map(m => m.user);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $addToSet: { groups: group._id } }
    );

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: {
        group: populatedGroup
      }
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating group'
    });
  }
};

// @desc    Get all user's groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        groups,
        count: groups.length
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching groups'
    });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      'members.user': userId,
      isActive: true
    })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found or you are not a member'
      });
    }

    // Get recent expenses for this group
    const expenses = await Expense.find({
      group: id,
      is_deleted: false
    })
    .populate('paid_by', 'name email avatar')
    .populate('splits.person', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        group,
        expenses
      }
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching group'
    });
  }
};

// @desc    Add member to group
// @route   POST /api/groups/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find group and check if user is admin
    const group = await Group.findOne({
      _id: id,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if current user is admin
    const currentUserMembership = group.members.find(m => m.user.toString() === userId);
    if (currentUserMembership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can add members'
      });
    }

    // Find user to add
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this group'
      });
    }

    // Add member to group
    group.members.push({
      user: userToAdd._id,
      role: 'member'
    });

    await group.save();

    // Add group to user's groups
    await User.findByIdAndUpdate(userToAdd._id, {
      $addToSet: { groups: group._id }
    });

    const updatedGroup = await Group.findById(id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json({
      success: true,
      message: `${userToAdd.name} added to group successfully`,
      data: {
        group: updatedGroup
      }
    });

  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding member'
    });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:id/members/:memberId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if current user is admin or removing themselves
    const currentUserMembership = group.members.find(m => m.user.toString() === userId);
    const canRemove = currentUserMembership.role === 'admin' || userId === memberId;

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove yourself or be an admin to remove others'
      });
    }

    // Cannot remove the group creator
    if (group.createdBy.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group creator'
      });
    }

    // Remove member
    group.members = group.members.filter(m => m.user.toString() !== memberId);
    await group.save();

    // Remove group from user's groups
    await User.findByIdAndUpdate(memberId, {
      $pull: { groups: group._id }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing member'
    });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({
      _id: id,
      'members.user': userId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is admin
    const currentUserMembership = group.members.find(m => m.user.toString() === userId);
    if (currentUserMembership.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update group details'
      });
    }

    // Update fields
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar !== undefined) group.avatar = avatar;

    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: {
        group: updatedGroup
      }
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating group'
    });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  addMember,
  removeMember,
  updateGroup
};