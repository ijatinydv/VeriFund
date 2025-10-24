import { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
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
import { recordInvestment } from '../../services/api';

/**
 * InvestModal Component
 * Modal for investing in a project via Web3 (ETH only - simplified for hackathon demo)
 * Uses wagmi v2 hooks for blockchain interaction
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onClose - Function to close modal
 * @param {Object} project - Project data including splitter contract address
 */
function InvestModal({ open, onClose, project }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [investmentRecorded, setInvestmentRecorded] = useState(false);
  
  const queryClient = useQueryClient();

  // Wagmi v2 hook for sending ETH transactions
  const {
    data: txHash,
    isPending: isTxPending,
    error: txError,
    sendTransaction,
    reset: resetTransaction,
  } = useSendTransaction();

  // Wait for transaction confirmation (v2 hook)
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Mutation to record investment in backend
  const recordInvestmentMutation = useMutation({
    mutationFn: (investmentData) => recordInvestment(investmentData),
    onSuccess: () => {
      setInvestmentRecorded(true);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['myInvestments'] });
      
      toast.success('🎉 Investment recorded successfully!');
    },
    onError: (error) => {
      console.error('Failed to record investment:', error);
      toast.error('Transaction succeeded but failed to record investment. Please contact support.');
    },
  });

  // Auto-record investment when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txHash && !investmentRecorded && !recordInvestmentMutation.isPending) {
      console.log('Transaction confirmed, recording investment...');
      
      recordInvestmentMutation.mutate({
        projectId: project.id,
        amount: parseFloat(amount),
        transactionHash: txHash,
        currency: 'ETH',
      });
    }
  }, [isConfirmed, txHash, investmentRecorded, project.id, amount, recordInvestmentMutation]);

  // Validate and handle investment
  const handleInvest = () => {
    setError('');

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      toast.error('Please enter a valid amount');
      return;
    }

    // ETH investment (Web3 flow with useSendTransaction)
    if (!project.splitterContractAddress) {
      setError('Project contract address not found');
      toast.error('Project contract address not found');
      return;
    }

    try {
      // Convert ETH to Wei
      const amountInWei = parseEther(amount);
      
      // Show loading toast
      toast.loading('Preparing transaction...', { id: 'invest-tx' });
      
      // Send ETH to project's splitter contract using sendTransaction
      sendTransaction(
        {
          to: project.splitterContractAddress,
          value: amountInWei,
        },
        {
          onSuccess: () => {
            toast.dismiss('invest-tx');
            toast.success('Transaction sent! Waiting for confirmation...');
          },
          onError: (err) => {
            console.error('Transaction error:', err);
            setError(err.message || 'Failed to send transaction');
            toast.dismiss('invest-tx');
            toast.error(err.message || 'Failed to send transaction');
          },
        }
      );
      
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Failed to send transaction');
      toast.dismiss('invest-tx');
      toast.error(err.message || 'Failed to send transaction');
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isTxPending && !isConfirming && !recordInvestmentMutation.isPending) {
      setAmount('');
      setError('');
      setInvestmentRecorded(false);
      resetTransaction();
      onClose();
    }
  };

  // Get Etherscan link
  const getEtherscanLink = () => {
    const network = 'sepolia'; // Change based on your network
    return `https://${network}.etherscan.io/tx/${txHash}`;
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
        {isConfirmed && investmentRecorded && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Investment Successful! 🎉
            </Typography>
            <Typography variant="body2" gutterBottom>
              Your transaction has been confirmed and recorded on the blockchain.
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Amount: <strong>{amount} ETH</strong>
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

        {/* Recording Investment State */}
        {isConfirmed && !investmentRecorded && recordInvestmentMutation.isPending && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <div>
                <Typography variant="body2" fontWeight={600}>
                  Recording your investment...
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Please wait while we save your investment to the database
                </Typography>
              </div>
            </Box>
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
        {txHash && (
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
              {txHash}
            </Typography>
          </Box>
        )}

        {/* Amount Input */}
        {!isConfirmed && (
          <>
            <TextField
              fullWidth
              type="number"
              label="Investment Amount (ETH)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              disabled={isTxPending || isConfirming}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    ETH
                  </InputAdornment>
                ),
              }}
              helperText="Enter the amount of ETH you want to invest"
              sx={{ mb: 3 }}
              inputProps={{
                step: '0.01',
                min: '0',
              }}
            />

            {/* Project Contract Info */}
            {project?.splitterContractAddress && (
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
                  {project.splitterContractAddress}
                </Typography>
              </Box>
            )}

            {/* Important Notice */}
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                This will send ETH from your connected wallet to the project's smart contract. Make sure you're on the correct network and have sufficient funds for gas fees.
              </Typography>
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={isTxPending || isConfirming || recordInvestmentMutation.isPending}
        >
          {isConfirmed && investmentRecorded ? 'Close' : 'Cancel'}
        </Button>
        {!isConfirmed && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleInvest}
            disabled={isTxPending || isConfirming || !amount}
            startIcon={
              isTxPending || isConfirming ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AccountBalanceWalletIcon />
              )
            }
            sx={{ fontWeight: 600, minWidth: 150 }}
          >
            {isTxPending
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
