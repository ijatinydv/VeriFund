const User = require('../models/User.model');

/**
 * Get User Profile
 * @route GET /api/users/profile
 * @access Private
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-nonce -nonceExpiry -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        upiId: user.upiId,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update User Profile
 * @route PUT /api/users/profile
 * @access Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { name, upiId } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name !== undefined) {
      user.name = name;
    }
    if (upiId !== undefined) {
      user.upiId = upiId;
    }

    await user.save();

    console.log(`✅ User profile updated: ${user.walletAddress}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        upiId: user.upiId,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
