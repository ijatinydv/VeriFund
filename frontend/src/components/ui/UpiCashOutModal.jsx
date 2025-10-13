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
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QRCodeSVG } from 'qrcode.react';

/**
 * UPI Cash Out Modal
 * Displays UPI QR code for instant cash-out feature
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onClose - Function to close modal
 * @param {string} upiString - UPI payment string to encode in QR code
 * @param {Object} payoutData - Payout details (amount, project, etc.)
 * @param {boolean} isLoading - Loading state
 */
function UpiCashOutModal({ open, onClose, upiString = null, payoutData = null, isLoading = false }) {
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
      onClose={onClose}
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
            Instant UPI Cash Out
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Withdraw your earnings instantly to your bank account
        </Typography>
      </DialogTitle>

      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="body1" color="text.secondary">
              Generating your UPI QR code...
            </Typography>
          </Box>
        ) : upiString ? (
          <>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Fast & Secure Payment
              </Typography>
              <Typography variant="body2">
                Scan the QR code below with any UPI app to receive your funds instantly
              </Typography>
            </Alert>

            {/* Payout Amount Display */}
            {payoutData && (
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, rgba(0, 200, 83, 0.05) 100%)',
                  border: '1px solid rgba(0, 200, 83, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Cash-Out Amount
                </Typography>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  {formatCurrency(payoutData.payoutAmount)}
                </Typography>
                {payoutData.projectTitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    From: {payoutData.projectTitle}
                  </Typography>
                )}
              </Box>
            )}

            {/* QR Code Display */}
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
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <QRCodeSVG
                  value={upiString}
                  size={256}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </Box>

              <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                Scan with UPI App
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Google Pay • PhonePe • Paytm • BHIM
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* UPI ID Display */}
            {payoutData?.recipientUpi && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Or pay directly to UPI ID:
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{
                    fontFamily: 'monospace',
                    color: 'secondary.main',
                  }}
                >
                  {payoutData.recipientUpi}
                </Typography>
              </Box>
            )}

            {/* Instructions */}
            <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
              <Typography variant="caption" component="div">
                <strong>How it works:</strong>
                <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  <li>Open your preferred UPI app</li>
                  <li>Scan the QR code above</li>
                  <li>Verify the pre-filled amount</li>
                  <li>Complete the payment</li>
                  <li>Funds will be credited instantly!</li>
                </ol>
              </Typography>
            </Alert>
          </>
        ) : (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              No Payout Available
            </Typography>
            <Typography variant="body2">
              Please select a project with available funds to cash out.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Close
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={onClose}
          sx={{ fontWeight: 600 }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default UpiCashOutModal;
