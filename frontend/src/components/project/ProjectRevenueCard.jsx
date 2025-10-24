import { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Card, CardContent, Chip, Skeleton } from '@mui/material';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import VeriFundSplitterABI from '../../abi/VeriFundSplitter.json';
import { toast } from 'react-hot-toast';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import useAuth from '../../hooks/useAuth';

/**
 * ProjectRevenueCard Component (wagmi v2 compliant)
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
  const { isConnected } = useAccount();
  const { user } = useAuth();

  // Read pending payment from the contract
  const { 
    data: pendingAmountWei, 
    refetch: refetchPendingPayment,
    isLoading: isLoadingBalance 
  } = useReadContract({
    address: project.splitterContractAddress,
    abi: VeriFundSplitterABI,
    functionName: 'pendingPayment',
    args: [user?.walletAddress],
    query: {
      enabled: !!user?.walletAddress && !!project.splitterContractAddress,
      refetchInterval: 5000, // Poll every 5 seconds for real-time updates
    },
  });

  // Execute the withdrawal using wagmi v2
  const { 
    writeContract, 
    data: txHash,
    isPending: isWithdrawing,
    error: writeError
  } = useWriteContract();

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Convert BigInt to ETH for display
  const withdrawableAmountEth = pendingAmountWei ? formatEther(pendingAmountWei) : '0';

  // Handle withdrawal button click (wagmi v2 pattern)
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawableAmountEth);
    if (amount <= 0) {
      toast.error('No funds available to withdraw.');
      return;
    }

    if (!user?.walletAddress) {
      toast.error('Please connect your wallet first.');
      return;
    }

    try {
      toast.loading('Preparing withdrawal transaction...', { id: 'withdraw-tx' });
      
      // Wagmi v2: directly call writeContract with contract details
      writeContract({
        address: project.splitterContractAddress,
        abi: VeriFundSplitterABI,
        functionName: 'release',
        args: [user.walletAddress],
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
    if (writeError) {
      console.error('Write error:', writeError);
      toast.error(writeError.shortMessage || 'Transaction failed. Please try again.', { id: 'withdraw-tx' });
    }
  }, [writeError]);

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
              <Skeleton width={100} height={40} />
              <Typography variant="body2" color="text.secondary">
                Loading...
              </Typography>
            </Box>
          ) : (
            <Typography 
              variant="h4" 
              color="success.main" 
              fontWeight={700}
              sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}
            >
              {parseFloat(withdrawableAmountEth).toFixed(6)}
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
            parseFloat(withdrawableAmountEth) <= 0 ||
            isLoadingBalance
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
            boxShadow: parseFloat(withdrawableAmountEth) > 0 ? '0 4px 14px 0 rgba(0, 200, 83, 0.39)' : 'none',
          }}
        >
          {isWithdrawing || isConfirming
            ? 'Processing...'
            : parseFloat(withdrawableAmountEth) <= 0
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
