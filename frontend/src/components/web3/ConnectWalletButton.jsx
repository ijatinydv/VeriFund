import { useState, useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import toast from 'react-hot-toast';
import {
  Button,
  Menu,
  MenuItem,
  Box,
  Typography,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import useAuth from '../../hooks/useAuth';
import RoleSelectionDialog from '../auth/RoleSelectionDialog';

/**
 * ConnectWalletButton Component with Authentication
 * Handles both wallet connection and application authentication
 * 
 * Flow:
 * 1. User clicks "Connect Wallet"
 * 2. User selects wallet provider and connects
 * 3. Automatically triggers authentication with signature
 * 4. User is logged into the application
 */
function ConnectWalletButton() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [pendingAuth, setPendingAuth] = useState(false);
  const hasAttemptedAuth = useRef(false);

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Authentication hook
  const { isAuthenticated, isLoading: isAuthLoading, login, logout } = useAuth();

  const open = Boolean(anchorEl);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    const authenticateWallet = async () => {
      // Only authenticate if wallet is connected but user is not authenticated
      // Also check if connector is ready to prevent race conditions
      if (isConnected && address && !isAuthenticated && !isAuthLoading && !pendingAuth) {
        // Prevent multiple authentication attempts for the same address
        if (hasAttemptedAuth.current === address) {
          return;
        }

        console.log('🔐 Wallet connected, initiating authentication...');
        console.log('📍 Address:', address);
        
        // Add a delay to ensure the connector is fully ready
        // This prevents "Connector not connected" errors and ensures MetaMask is ready
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Double check that wallet is still connected after delay
        if (!isConnected || !address) {
          console.log('⚠️ Wallet disconnected during initialization');
          return;
        }
        
        hasAttemptedAuth.current = address;
        setPendingAuth(true);
        setAuthError(null);
        
        try {
          // Normalize address before login
          const result = await login(address);
          
          console.log('🔍 Login result:', result);
          
          if (result.success) {
            console.log('✅ Authentication successful!', result.user);
            toast.success(`Welcome back! Logged in as ${result.user.role}`, {
              icon: '🎉',
              duration: 3000,
            });
          } else {
            // Handle connector not connected error - retry once
            if (result.error?.includes('Wallet disconnected') || 
                result.error?.includes('Connector not connected') ||
                result.error?.includes('not connected')) {
              console.log('🔄 Connector issue detected, retrying after delay...');
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Retry authentication
              const retryResult = await login(address);
              
              if (!retryResult.success) {
                console.error('❌ Authentication failed after retry:', retryResult.error);
                setAuthError(retryResult.error);
                hasAttemptedAuth.current = false;
                toast.error(retryResult.error || 'Authentication failed');
                disconnect();
              }
            }
            // Check if it's a new user
            else if (result.isNewUser || result.error?.includes('not found')) {
              console.log('👤 New user detected - showing role selection');
              setRoleModalOpen(true);
            } 
            // Handle user cancellation gracefully
            else if (result.error?.includes('cancelled') || result.error?.includes('rejected')) {
              console.log('👤 User cancelled authentication');
              toast.error('Authentication was cancelled', {
                icon: '⚠️',
              });
              hasAttemptedAuth.current = false;
              disconnect();
            }
            else {
              console.error('❌ Authentication failed:', result.error);
              setAuthError(result.error);
              toast.error(result.error || 'Authentication failed');
              hasAttemptedAuth.current = false;
              disconnect();
            }
          }
        } catch (error) {
          console.error('❌ Unexpected authentication error:', error);
          setAuthError(error.message);
          toast.error(error.message || 'Unexpected error during authentication');
          hasAttemptedAuth.current = false;
          disconnect();
        } finally {
          setPendingAuth(false);
        }
      }
    };

    authenticateWallet();
  }, [isConnected, address, isAuthenticated, isAuthLoading, login, disconnect, pendingAuth]);

  // Reset auth attempt tracking when disconnected
  useEffect(() => {
    if (!isConnected) {
      hasAttemptedAuth.current = false;
    }
  }, [isConnected]);

  // Handle role selection for new users
  const handleRoleSelect = async (role) => {
    console.log('👤 Role selected:', role);
    setRoleModalOpen(false);
    setAuthError(null);
    
    if (address) {
      try {
        toast.loading('Setting up your account...', { id: 'role-setup' });
        
        const result = await login(address, role);
        
        toast.dismiss('role-setup');
        console.log('🔍 Login with role result:', result);
        
        if (!result.success) {
          console.error('❌ Role-based login failed:', result.error);
          setAuthError(result.error);
          toast.error(result.error || 'Failed to set up account');
          disconnect();
        } else {
          console.log('✅ Successfully logged in with role:', role);
          toast.success(`🎉 Welcome to VeriFund as a ${role}!`, {
            duration: 4000,
          });
        }
      } catch (error) {
        toast.dismiss('role-setup');
        console.error('❌ Role selection error:', error);
        setAuthError(error.message);
        toast.error(error.message || 'Failed to set up account');
        disconnect();
      }
    }
  };

  // Open account menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close account menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Open wallet selection modal
  const handleOpenWalletModal = () => {
    setAuthError(null);
    setWalletModalOpen(true);
  };

  // Close wallet selection modal
  const handleCloseWalletModal = () => {
    setWalletModalOpen(false);
    setAuthError(null);
  };

  // Connect to wallet
  const handleConnect = async (connector) => {
    try {
      setAuthError(null);
      toast.loading('Connecting wallet...', { id: 'wallet-connect' });
      await connect({ connector });
      toast.dismiss('wallet-connect');
      handleCloseWalletModal();
      // Authentication will be triggered by useEffect
    } catch (err) {
      toast.dismiss('wallet-connect');
      console.error('Wallet connection error:', err);
      setAuthError(err.message || 'Failed to connect wallet');
      toast.error(err.message || 'Failed to connect wallet');
    }
  };

  // Disconnect wallet and logout
  const handleDisconnect = async () => {
    handleClose();
    await logout();
    disconnect();
    toast.success('Disconnected successfully', {
      icon: '👋',
    });
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopySuccess(true);
      toast.success('Address copied to clipboard!', {
        icon: '📋',
        duration: 2000,
      });
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Truncate address for display
  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Show loading state during authentication
  if (isConnected && !isAuthenticated && isAuthLoading) {
    return (
      <Button
        variant="outlined"
        color="secondary"
        disabled
        startIcon={<CircularProgress size={20} />}
        sx={{
          fontWeight: 600,
          px: 3,
          borderWidth: 2,
        }}
      >
        Authenticating...
      </Button>
    );
  }

  // If wallet is disconnected or not authenticated, show "Connect Wallet" button
  if (!isConnected || !isAuthenticated) {
    return (
      <>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AccountBalanceWalletIcon />}
          onClick={handleOpenWalletModal}
          disabled={isPending}
          sx={{
            fontWeight: 600,
            px: 3,
            boxShadow: '0 4px 14px 0 rgba(0, 191, 165, 0.39)',
          }}
        >
          {isPending ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        {/* Wallet Selection Modal */}
        <Dialog
          open={walletModalOpen}
          onClose={handleCloseWalletModal}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              backgroundColor: 'background.paper',
            },
          }}
        >
          <DialogTitle>
            <Box component="span" sx={{ fontWeight: 600, display: 'block' }}>
              Connect Wallet
            </Box>
            <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
              Choose your preferred wallet to connect and authenticate
            </Typography>
          </DialogTitle>
          <DialogContent>
            {authError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {authError}
              </Alert>
            )}
            <List>
              {connectors.map((connector) => (
                <ListItem key={connector.uid} disablePadding>
                  <ListItemButton
                    onClick={() => handleConnect(connector)}
                    disabled={isPending}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 191, 165, 0.1)',
                        borderColor: 'secondary.main',
                      },
                    }}
                  >
                    <ListItemText
                      primary={connector.name}
                      secondary={isPending ? 'Connecting...' : 'Available'}
                    />
                    {isPending && <CircularProgress size={20} />}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              By connecting, you'll be asked to sign a message to verify wallet ownership. This is free and doesn't involve any blockchain transactions.
            </Typography>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // If wallet is connected and authenticated, show address button with dropdown
  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        onClick={handleClick}
        startIcon={
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'secondary.main',
              fontSize: '0.75rem',
            }}
          >
            {address?.slice(2, 4).toUpperCase()}
          </Avatar>
        }
        endIcon={isAuthenticated ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : null}
        sx={{
          fontWeight: 600,
          px: 2,
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        }}
      >
        {truncateAddress(address)}
      </Button>

      {/* Role Selection Modal */}
      <RoleSelectionDialog
        open={roleModalOpen}
        onSelectRole={handleRoleSelect}
        onClose={() => {
          setRoleModalOpen(false);
          disconnect();
        }}
      />

      {/* Account Menu Dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 240,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Account Info */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Connected & Authenticated
            </Typography>
            <CheckCircleIcon sx={{ fontSize: 14, ml: 0.5, color: 'success.main' }} />
          </Box>
          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
            {truncateAddress(address)}
          </Typography>
        </Box>

        <Divider />

        {/* Copy Address */}
        <MenuItem onClick={handleCopyAddress}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
          <Typography variant="body2">
            {copySuccess ? 'Copied!' : 'Copy Address'}
          </Typography>
        </MenuItem>

        <Divider />

        {/* Disconnect */}
        <MenuItem onClick={handleDisconnect} sx={{ color: 'error.main' }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
          <Typography variant="body2">Disconnect & Logout</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

export default ConnectWalletButton;
