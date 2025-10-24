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

    // Build update object with only provided fields
    const updateFields = {};
    if (name !== undefined) {
      updateFields.name = name;
    }
    if (upiId !== undefined) {
      updateFields.upiId = upiId;
    }

    // Check if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update'
      });
    }

    // Update user using findByIdAndUpdate with $set operator
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      {
        new: true,           // Return the updated document
        runValidators: true, // Run schema validators
        context: 'query'     // Required for some validators
      }
    ).select('-nonce -nonceExpiry -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User profile updated: ${user.walletAddress}`, updateFields);

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
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
