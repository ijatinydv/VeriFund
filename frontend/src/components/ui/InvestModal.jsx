import { useState } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Link,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

/**
 * InvestModal Component
 * Modal for investing ETH in a project via Web3 transaction
 * Uses wagmi's useSendTransaction for blockchain interaction
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onClose - Function to close modal
 * @param {Object} project - Project data including splitter contract address
 */
function InvestModal({ open, onClose, project }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // Wagmi hook for sending transactions
  const {
    data: hash,
    isPending,
    error: txError,
    sendTransaction,
  } = useSendTransaction();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Validate and handle investment
  const handleInvest = () => {
    setError('');

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!project.splitterContractAddress) {
      setError('Project contract address not found');
      return;
    }

    try {
      // Send transaction to project's splitter contract
      sendTransaction({
        to: project.splitterContractAddress,
        value: parseEther(amount),
      });
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Failed to send transaction');
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isPending && !isConfirming) {
      setAmount('');
      setError('');
      onClose();
    }
  };

  // Get Etherscan link
  const getEtherscanLink = () => {
    const network = 'sepolia'; // Change based on your network
    return `https://${network}.etherscan.io/tx/${hash}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'background.paper',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight={700}>
          Fund Project
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {project?.title}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Success State */}
        {isConfirmed && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Investment Successful!
            </Typography>
            <Typography variant="body2" gutterBottom>
              Your transaction has been confirmed on the blockchain.
            </Typography>
            <Link
              href={getEtherscanLink()}
              target="_blank"
              rel="noopener"
              sx={{ fontSize: '0.875rem' }}
            >
              View on Etherscan →
            </Link>
          </Alert>
        )}

        {/* Error State */}
        {(txError || error) && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              {error || txError?.message || 'Transaction failed'}
            </Typography>
          </Alert>
        )}

        {/* Confirming State */}
        {isConfirming && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <div>
                <Typography variant="body2" fontWeight={600}>
                  Waiting for confirmation...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your transaction is being processed on the blockchain
                </Typography>
              </div>
            </Box>
          </Alert>
        )}

        {/* Transaction Hash */}
        {hash && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Transaction Hash
            </Typography>
            <Typography
              variant="caption"
              sx={{
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
              }}
            >
              {hash}
            </Typography>
          </Box>
        )}

        {/* Amount Input */}
        {!isConfirmed && (
          <>
            <TextField
              fullWidth
              type="number"
              label="Investment Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              disabled={isPending || isConfirming}
              InputProps={{
                startAdornment: <InputAdornment position="start">ETH</InputAdornment>,
              }}
              helperText="Enter the amount of ETH you want to invest"
              sx={{ mb: 3 }}
              inputProps={{
                step: '0.01',
                min: '0',
              }}
            />

            {/* Project Contract Info */}
            <Box sx={{ p: 2, bgcolor: 'rgba(0, 191, 165, 0.05)', borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Recipient Contract
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                }}
              >
                {project?.splitterContractAddress}
              </Typography>
            </Box>

            {/* Important Notice */}
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                This will send ETH from your connected wallet to the project's smart contract.
                Make sure you're on the correct network and have sufficient funds for gas fees.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isPending || isConfirming}>
          {isConfirmed ? 'Close' : 'Cancel'}
        </Button>
        {!isConfirmed && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleInvest}
            disabled={isPending || isConfirming || !amount}
            startIcon={
              isPending || isConfirming ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AccountBalanceWalletIcon />
              )
            }
            sx={{ fontWeight: 600, minWidth: 150 }}
          >
            {isPending
              ? 'Confirm in Wallet...'
              : isConfirming
              ? 'Processing...'
              : 'Confirm Investment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default InvestModal;
