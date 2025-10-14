import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Skeleton,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import InvestmentsIcon from '@mui/icons-material/AccountBalance';
import InvestmentCard from '../components/project/InvestmentCard';
import { fetchMyInvestments } from '../services/api';
import useAuth from '../hooks/useAuth';

/**
 * InvestorDashboard Component
 * Protected dashboard for investors to track their portfolio
 * Features: Investment stats, DataGrid table, and engaging empty state
 */
function InvestorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch investor's investments
  const {
    data: investments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myInvestments'],
    queryFn: fetchMyInvestments,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Calculate statistics
  const stats = {
    totalInvested: investments?.reduce((sum, inv) => sum + (inv.amountInr || 0), 0) || 0,
    totalReturns: investments?.reduce((sum, inv) => {
      // Calculate potential returns based on investment amount
      // In a real app, this would come from actual revenue data
      const potentialReturn = (inv.amountInr || 0) * 0.15; // Example: 15% returns
      return sum + potentialReturn;
    }, 0) || 0,
    numberOfInvestments: investments?.length || 0,
  };

  // Format currency
  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Calculate ROI percentage
  const roiPercentage = stats.totalInvested > 0 
    ? ((stats.totalReturns / stats.totalInvested) * 100).toFixed(1)
    : 0;

  // Loading State
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Skeleton variant="text" width={300} height={60} sx={{ mb: 4 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rectangular" height={150} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Container>
    );
  }

  // Error State
  if (isError) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Failed to Load Dashboard
          </Typography>
          <Typography variant="body2">
            {error?.message || 'An unexpected error occurred. Please try again later.'}
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Investor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {user?.name || 'Investor'}! Track your portfolio and discover new opportunities.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Invested */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.1) 0%, rgba(13, 71, 161, 0.05) 100%)',
              border: '1px solid rgba(13, 71, 161, 0.2)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <AccountBalanceWalletIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Total Invested
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {formatCurrency(stats.totalInvested)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Across {stats.numberOfInvestments} projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Returns */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, rgba(0, 200, 83, 0.05) 100%)',
              border: '1px solid rgba(0, 200, 83, 0.2)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <TrendingUpIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Total Returns
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {formatCurrency(stats.totalReturns)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {stats.totalInvested > 0
                  ? `${roiPercentage}% ROI (projected)`
                  : 'No returns yet'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Number of Investments */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0, 191, 165, 0.1) 0%, rgba(0, 191, 165, 0.05) 100%)',
              border: '1px solid rgba(0, 191, 165, 0.2)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <InvestmentsIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Investments
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="secondary.main">
                {stats.numberOfInvestments}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Active portfolio projects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Investments Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Your Portfolio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track all your investments and their performance
        </Typography>
      </Box>

      {/* Investment Cards or Empty State */}
      {investments && investments.length > 0 ? (
        <Grid container spacing={3}>
          {investments.map((investment) => (
            <Grid item xs={12} sm={6} md={4} key={investment._id}>
              <InvestmentCard investment={investment} />
            </Grid>
          ))}
        </Grid>
      ) : (
        // Empty State
        <Card
          elevation={0}
          sx={{
            py: 8,
            px: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.03) 0%, rgba(0, 191, 165, 0.03) 100%)',
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'rgba(0, 191, 165, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <ShowChartIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
          </Box>

          <Typography variant="h4" fontWeight={700} gutterBottom>
            Your Portfolio Awaits
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            You haven't made any investments yet. Start building your portfolio by discovering
            innovative projects powered by AI analysis and blockchain technology.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<SearchIcon />}
              onClick={() => navigate('/browse')}
              sx={{
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Browse Projects
            </Button>
          </Stack>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Investment Tip:</strong> Look for projects with high AI potential scores
              and strong creator profiles. Diversify your portfolio across multiple projects to minimize risk.
            </Typography>
          </Box>
        </Card>
      )}
    </Container>
  );
}

export default InvestorDashboard;
