import { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent, Chip } from '@mui/material';
import { useAccount, useReadContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import splitterAbi from '../../abi/VeriFundSplitter.json';
import { toast } from 'react-hot-toast';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

/**
 * ProjectRevenueCard Component
 * Displays on-chain revenue for a project and allows creators to withdraw funds
 * from the VeriFundSplitter smart contract.
 * 
 * Features:
 * - Reads pending payment from smart contract using pendingPayment()
 * - Allows withdrawal via release() function
 * - Real-time balance updates after successful withdrawal
 * - Transaction status feedback via toasts
 */
const ProjectRevenueCard = ({ project }) => {
  const { address: userAddress, isConnected } = useAccount();

  // Read pending payment from the contract
  const { 
    data: pendingPayment, 
    refetch: refetchPendingPayment,
    isLoading: isLoadingBalance 
  } = useReadContract({
    address: project.splitterContractAddress,
    abi: splitterAbi,
    functionName: 'pendingPayment',
    args: [userAddress],
    query: {
      enabled: isConnected && !!project.splitterContractAddress && !!userAddress,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates (replaces watch: true)
    },
  });

  // Simulate the withdrawal transaction
  const { data: simulateData } = useSimulateContract({
    address: project.splitterContractAddress,
    abi: splitterAbi,
    functionName: 'release',
    args: [userAddress],
    query: {
      enabled: isConnected && !!project.splitterContractAddress && !!userAddress && pendingPayment > 0n,
    },
  });

  // Execute the withdrawal
  const { 
    writeContract, 
    data: txHash,
    isPending: isWithdrawing 
  } = useWriteContract();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Convert BigInt to ETH for display
  const withdrawableAmount = pendingPayment ? parseFloat(formatEther(pendingPayment)) : 0;

  // Handle withdrawal button click
  const handleWithdraw = async () => {
    if (withdrawableAmount <= 0) {
      toast.error('No funds available to withdraw.');
      return;
    }

    if (!simulateData?.request) {
      toast.error('Unable to prepare transaction. Please try again.');
      return;
    }

    try {
      toast.loading('Preparing withdrawal transaction...', { id: 'withdraw-tx' });
      writeContract(simulateData.request, {
        onSuccess: () => {
          toast.loading('Transaction submitted! Waiting for confirmation...', { id: 'withdraw-tx' });
        },
        onError: (err) => {
          console.error('Withdrawal error:', err);
          toast.error(err.shortMessage || 'Transaction failed. Please try again.', { id: 'withdraw-tx' });
        },
      });
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error(err.shortMessage || 'Transaction failed. Please try again.', { id: 'withdraw-tx' });
    }
  };

  // Handle transaction status changes
  useEffect(() => {
    if (isWithdrawing) {
      toast.loading('Waiting for wallet confirmation...', { id: 'withdraw-tx' });
    }
  }, [isWithdrawing]);

  useEffect(() => {
    if (txHash && !isConfirmed) {
      toast.loading('Transaction submitted! Waiting for confirmation...', { id: 'withdraw-tx' });
    }
  }, [txHash, isConfirmed]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Withdrawal successful! Funds transferred to your wallet.', { 
        id: 'withdraw-tx',
        duration: 5000,
        icon: '🎉',
      });
      // Refetch balance after successful withdrawal
      refetchPendingPayment();
    }
  }, [isConfirmed, refetchPendingPayment]);

  // Don't render if no contract address exists
  if (!project.splitterContractAddress) {
    return null;
  }

  // Don't render if wallet not connected
  if (!isConnected) {
    return null;
  }

  return (
    <Card 
      sx={{ 
        mt: 2,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.08) 0%, rgba(0, 191, 165, 0.08) 100%)',
        border: '1px solid rgba(0, 200, 83, 0.2)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 200, 83, 0.15)',
        },
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: 'success.main',
              color: 'white',
              mr: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccountBalanceWalletIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              On-Chain Revenue
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {project.title}
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
            label="Web3"
            size="small"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Available Balance */}
        <Box 
          sx={{ 
            my: 3, 
            p: 2.5, 
            borderRadius: 2, 
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Available to Withdraw:
          </Typography>
          {isLoadingBalance ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="success" />
              <Typography variant="body2" color="text.secondary">
                Loading balance...
              </Typography>
            </Box>
          ) : (
            <Typography 
              variant="h4" 
              color="success.main" 
              fontWeight={700}
              sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}
            >
              {withdrawableAmount.toFixed(6)}
              <Typography variant="h6" component="span" color="text.secondary">
                ETH
              </Typography>
            </Typography>
          )}
        </Box>

        {/* Withdraw Button */}
        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={handleWithdraw}
          disabled={
            !isConnected || 
            isWithdrawing || 
            isConfirming || 
            withdrawableAmount <= 0 ||
            isLoadingBalance ||
            !simulateData?.request
          }
          startIcon={
            (isWithdrawing || isConfirming) ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AccountBalanceWalletIcon />
            )
          }
          sx={{
            fontWeight: 600,
            py: 1.5,
            boxShadow: withdrawableAmount > 0 ? '0 4px 14px 0 rgba(0, 200, 83, 0.39)' : 'none',
          }}
        >
          {isWithdrawing || isConfirming
            ? 'Processing...'
            : withdrawableAmount <= 0
            ? 'No Funds Available'
            : 'Withdraw Funds to Wallet'}
        </Button>

        {/* Helper Text */}
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}
        >
          Funds will be transferred to your connected wallet address
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ProjectRevenueCard;
