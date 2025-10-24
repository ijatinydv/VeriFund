import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Grid,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentIcon from '@mui/icons-material/Payment';
import toast from 'react-hot-toast';
import api from '../services/api';

/**
 * User Profile Page
 * Allows users to view and update their profile information
 */
function ProfilePage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    upiId: '',
  });

  // Fetch user profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data;
    },
    onSuccess: (data) => {
      setFormData({
        name: data.name || '',
        upiId: data.upiId || '',
      });
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedData) => {
      const response = await api.put('/users/profile', updatedData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="body1" fontWeight={600}>
            Error loading profile
          </Typography>
          <Typography variant="body2">
            {error.message || 'Failed to load user profile. Please try again.'}
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.03) 0%, rgba(0, 191, 165, 0.03) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <PersonIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your account information and payment details
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Wallet Address (Read-only) */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Wallet Address
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <AccountBalanceWalletIcon sx={{ mr: 1.5, color: 'primary.main' }} />
            <Typography
              variant="body1"
              sx={{
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              {profileData?.walletAddress}
            </Typography>
          </Box>
        </Box>

        {/* Role (Read-only) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Role
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(0, 191, 165, 0.1)',
                border: '1px solid rgba(0, 191, 165, 0.3)',
              }}
            >
              <Typography variant="body1" fontWeight={600} color="secondary.main">
                {profileData?.role}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Editable Form */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="UPI ID"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                placeholder="yourname@paytm / yourname@ybl"
                variant="outlined"
                InputProps={{
                  startAdornment: <PaymentIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                helperText="Your UPI ID will be used for receiving payouts"
              />
            </Grid>
          </Grid>

          {/* Save Button */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              startIcon={updateMutation.isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={updateMutation.isLoading}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
              }}
            >
              {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default ProfilePage;
