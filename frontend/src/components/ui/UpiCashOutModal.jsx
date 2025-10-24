import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Divider,
  CircularProgress,
  TextField,
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../../services/api';

/**
 * UPI Cash Out Modal - 3-Step Simulated Push Payout Flow
 * Step 1 (confirm): User confirms amount and UPI ID
 * Step 2 (loading): Processing simulation
 * Step 3 (success): Display receipt with scannable QR code
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onClose - Function to close modal
 * @param {Object} payoutData - Payout details (projectId, payoutAmount, etc.)
 */
function UpiCashOutModal({ open, onClose, payoutData = null }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'loading' | 'success'
  const [receiptData, setReceiptData] = useState(null);
  const [editableUpiId, setEditableUpiId] = useState('');

  // Fetch user profile when modal opens
  const { data: userProfile, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data;
    },
    enabled: open, // Only fetch when modal is open
    onSuccess: (data) => {
      setEditableUpiId(data.upiId || '');
    },
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setReceiptData(null);
      refetchProfile();
    }
  }, [open, refetchProfile]);

  // Mutation to initiate payout
  const payoutMutation = useMutation({
    mutationFn: async () => {
      if (!payoutData?.projectId) {
        throw new Error('Project ID is required');
      }

      // Update user's UPI ID if changed
      if (editableUpiId && editableUpiId !== userProfile?.upiId) {
        await api.put('/users/profile', { upiId: editableUpiId });
      }

      const response = await api.post(`/payout/${payoutData.projectId}/initiate`);
      return response.data;
    },
    onMutate: () => {
      setStep('loading');
    },
    onSuccess: (data) => {
      setReceiptData(data);
      setStep('success');
      toast.success('Payout processed successfully!');
    },
    onError: (error) => {
      setStep('confirm');
      toast.error(error.message || 'Failed to process payout');
    },
  });

  const handleConfirmPayout = () => {
    if (!editableUpiId || editableUpiId.trim() === '') {
      toast.error('Please enter your UPI ID');
      return;
    }
    payoutMutation.mutate();
  };

  const handleClose = () => {
    setStep('confirm');
    setReceiptData(null);
    onClose();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCodeIcon color="secondary" />
          <Typography variant="h5" fontWeight={700}>
            {step === 'success' ? 'Payout Receipt' : 'UPI Payout'}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {step === 'confirm' && 'Confirm your payout details'}
          {step === 'loading' && 'Processing your payment...'}
          {step === 'success' && 'Your payout was successful!'}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Step 1: Confirm */}
        {step === 'confirm' && (
          <>
            {/* Payout Amount Display */}
            {payoutData && (
              <Box
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(0, 191, 165, 0.1) 0%, rgba(0, 191, 165, 0.05) 100%)',
                  border: '1px solid rgba(0, 191, 165, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Payout Amount
                </Typography>
                <Typography variant="h3" fontWeight={700} color="secondary.main">
                  {formatCurrency(payoutData.payoutAmount)}
                </Typography>
                {payoutData.projectTitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    From: {payoutData.projectTitle}
                  </Typography>
                )}
              </Box>
            )}

            <Divider sx={{ mb: 3 }} />

            {/* UPI ID Input */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Your UPI ID"
                value={editableUpiId}
                onChange={(e) => setEditableUpiId(e.target.value)}
                placeholder="yourname@paytm / yourname@ybl"
                variant="outlined"
                InputProps={{
                  startAdornment: <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="This UPI ID will receive the payout"
              />
            </Box>

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="caption" component="div">
                <strong>What happens next:</strong>
                <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Click "Confirm & Withdraw" to process payout</li>
                  <li>Your on-chain earnings will be calculated</li>
                  <li>A simulated UPI payment will be initiated</li>
                  <li>You'll receive a digital receipt with QR code</li>
                </ol>
              </Typography>
            </Alert>
          </>
        )}

        {/* Step 2: Loading */}
        {step === 'loading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Processing Payout...
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Reading your earnings from the blockchain contract
              <br />
              and initiating UPI transfer
            </Typography>
          </Box>
        )}

        {/* Step 3: Success */}
        {step === 'success' && receiptData && (
          <>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                ✅ Payout Successful!
              </Typography>
              <Typography variant="body2">
                Your payment has been processed and transferred to your UPI account
              </Typography>
            </Alert>

            {/* Receipt Details */}
            <Box
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, rgba(0, 200, 83, 0.05) 100%)',
                border: '1px solid rgba(0, 200, 83, 0.3)',
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Transaction Details
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Amount (INR)</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(receiptData.payoutAmount)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Amount (ETH)</Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {receiptData.payoutAmountEth} ETH
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">UPI ID</Typography>
                  <Typography variant="body2" fontFamily="monospace" color="secondary.main">
                    {receiptData.recipientUpi}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                    {receiptData.transactionId}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body2">
                    {new Date(receiptData.timestamp).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* QR Code as Scannable Receipt */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.05) 0%, rgba(0, 191, 165, 0.05) 100%)',
                border: '2px solid rgba(0, 191, 165, 0.2)',
              }}
            >
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Scannable Receipt
              </Typography>
              
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <QRCodeSVG
                  value={JSON.stringify(receiptData)}
                  size={220}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Scan this QR code to view the complete transaction receipt
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {step === 'confirm' && (
          <>
            <Button onClick={handleClose} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleConfirmPayout}
              disabled={!editableUpiId || editableUpiId.trim() === ''}
              sx={{ fontWeight: 600 }}
            >
              Confirm & Withdraw
            </Button>
          </>
        )}

        {step === 'success' && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleClose}
            sx={{ fontWeight: 600 }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default UpiCashOutModal;
