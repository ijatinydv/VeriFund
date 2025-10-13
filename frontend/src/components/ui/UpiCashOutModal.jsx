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
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * UPI Cash Out Modal
 * Displays UPI QR code for instant cash-out feature
 * 
 * @param {boolean} open - Modal open state
 * @param {function} onClose - Function to close modal
 */
function UpiCashOutModal({ open, onClose }) {
  // Sample UPI QR code - Replace with your actual UPI QR code image
  const upiQrCodeUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23ffffff" width="300" height="300"/%3E%3Cpath fill="%23000000" d="M20,20h40v40h-40zM70,20h10v10h-10zM90,20h10v10h-10zM110,20h10v10h-10zM130,20h10v10h-10zM150,20h10v10h-10zM170,20h10v10h-10zM190,20h10v10h-10zM210,20h40v40h-40zM20,70h10v10h-10zM50,70h10v10h-10zM70,70h10v10h-10zM90,70h10v10h-10zM110,70h10v10h-10zM130,70h10v10h-10zM150,70h10v10h-10zM170,70h10v10h-10zM190,70h10v10h-10zM210,70h10v10h-10zM240,70h10v10h-10zM20,90h10v10h-10zM50,90h10v10h-10zM70,90h10v10h-10zM110,90h10v10h-10zM130,90h10v10h-10zM150,90h10v10h-10zM170,90h10v10h-10zM210,90h10v10h-10zM240,90h10v10h-10z"/%3E%3Ctext x="150" y="280" font-family="Arial" font-size="12" text-anchor="middle" fill="%23000000"%3EUPI QR Code%3C/text%3E%3C/svg%3E';

  const upiId = 'creator@upi'; // Replace with actual UPI ID

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
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Fast & Secure Payment
          </Typography>
          <Typography variant="body2">
            Scan the QR code below with any UPI app to receive your funds instantly
          </Typography>
        </Alert>

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
            <img
              src={upiQrCodeUrl}
              alt="UPI QR Code"
              style={{
                width: '250px',
                height: '250px',
                display: 'block',
              }}
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

        {/* UPI ID */}
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
            {upiId}
          </Typography>
        </Box>

        {/* Instructions */}
        <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
          <Typography variant="caption" component="div">
            <strong>How it works:</strong>
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>Open your preferred UPI app</li>
              <li>Scan the QR code above</li>
              <li>Enter the amount to withdraw</li>
              <li>Complete the payment</li>
              <li>Funds will be credited instantly!</li>
            </ol>
          </Typography>
        </Alert>
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
