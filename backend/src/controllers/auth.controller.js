const authService = require('../services/auth.service');

/**
 * Authentication Controllers
 * Handle HTTP requests for authentication endpoints
 */
class AuthController {
  /**
   * GET /api/auth/nonce/:walletAddress
   * Generate and return a nonce for wallet signature
   */
  async getNonce(req, res) {
    try {
      const { walletAddress } = req.params;
      const { role } = req.query; // Optional role for new users

      // Validate wallet address presence
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address is required'
        });
      }

      // Get nonce from service
      const result = await authService.getNonceToSign(walletAddress, role);

      return res.status(200).json({
        success: true,
        data: {
          nonce: result.nonce,
          isNewUser: result.isNewUser,
          message: result.message,
          expiresAt: result.expiresAt
        }
      });

    } catch (error) {
      console.error('Get nonce error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to generate nonce'
      });
    }
  }

  /**
   * POST /api/auth/login
   * Verify signature and authenticate user
   */
  async login(req, res) {
    try {
      const { walletAddress, signature, role } = req.body;

      // Validate required fields
      if (!walletAddress || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address and signature are required'
        });
      }

      // Authenticate user
      const result = await authService.loginUser({ walletAddress, signature, role });

      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          token: result.token,
          user: result.user
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      
      // Return appropriate status code based on error
      const statusCode = error.message.includes('not found') ? 404 :
                        error.message.includes('expired') ? 401 :
                        error.message.includes('verification failed') ? 401 : 400;

      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Authentication failed'
      });
    }
  }

  /**
   * PUT /api/auth/role
   * Update user role (protected route)
   */
  async updateRole(req, res) {
    try {
      const { role } = req.body;
      const userId = req.user.userId;

      // Validate role
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Role is required'
        });
      }

      // Update role
      const result = await authService.updateUserRole(userId, role);

      return res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: {
          token: result.token,
          user: result.user
        }
      });

    } catch (error) {
      console.error('Update role error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update role'
      });
    }
  }

  /**
   * GET /api/auth/verify
   * Verify JWT token validity (protected route)
   */
  async verifyToken(req, res) {
    try {
      // Token is already verified by auth middleware
      // Return user data from request
      return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          user: req.user
        }
      });

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh JWT token (protected route)
   */
  async refreshToken(req, res) {
    try {
      const userId = req.user.userId;

      // Refresh token
      const result = await authService.refreshToken(userId);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: result.token,
          user: result.user
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to refresh token'
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (protected route)
   * Note: With JWT, actual logout happens client-side by deleting token
   * This endpoint can be used for additional cleanup if needed
   */
  async logout(req, res) {
    try {
      // Additional logout logic can be added here
      // For example, blacklisting tokens, updating last activity, etc.

      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
}

module.exports = new AuthController();
