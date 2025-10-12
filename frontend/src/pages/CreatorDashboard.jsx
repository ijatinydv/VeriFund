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
import AddIcon from '@mui/icons-material/Add';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ProjectCard from '../components/project/ProjectCard';
import { fetchMyProjects } from '../services/api';
import useAuth from '../hooks/useAuth';

/**
 * CreatorDashboard Component
 * Protected dashboard for creators to manage their projects
 * Features: Stats overview, project list, and engaging empty state
 */
function CreatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch creator's projects
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myProjects'],
    queryFn: fetchMyProjects,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Calculate statistics
  const stats = {
    totalProjects: projects?.length || 0,
    activeFunding: projects?.filter((p) => p.status === 'Funding').length || 0,
    totalRevenue: projects?.reduce((sum, p) => sum + (p.totalRevenue || 0), 0) || 0,
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Creator Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name || 'Creator'}! Manage your projects and track performance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create-project')}
          sx={{ fontWeight: 600 }}
        >
          Create New Project
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Projects */}
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
                  <FolderOpenIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Total Projects
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="primary.main">
                {stats.totalProjects}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Projects created
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Funding */}
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
                  <TrendingUpIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Active Campaigns
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="secondary.main">
                {stats.activeFunding}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Currently seeking funding
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Revenue */}
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
                  <AccountBalanceWalletIcon />
                </Box>
                <Typography variant="h6" color="text.secondary">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Lifetime earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Your Projects
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage and monitor your project portfolio
        </Typography>
      </Box>

      {/* Projects List or Empty State */}
      {projects && projects.length > 0 ? (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard project={project} />
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
            <RocketLaunchIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
          </Box>

          <Typography variant="h4" fontWeight={700} gutterBottom>
            Ready to Launch Something Amazing?
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            You haven't created any projects yet. Start your journey by creating your first project
            and connecting with investors who believe in your vision.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-project')}
              sx={{
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
              }}
            >
              Create Your First Project
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={() => navigate('/browse')}
              sx={{ fontWeight: 600 }}
            >
              Browse Examples
            </Button>
          </Stack>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 2, maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              💡 <strong>Pro Tip:</strong> Projects with detailed descriptions, clear funding goals,
              and linked profiles receive 3x more investment on average.
            </Typography>
          </Box>
        </Card>
      )}
    </Container>
  );
}

export default CreatorDashboard;
