import { useState, useEffect, useRef } from 'react';
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
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ProjectCard from '../components/project/ProjectCard';
import UpiCashOutModal from '../components/ui/UpiCashOutModal';
import PotentialScoreDisplay from '../components/ui/PotentialScoreDisplay';
import { fetchMyProjects, getUpiQrCode } from '../services/api';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * CreatorDashboard Component
 * Protected dashboard for creators to manage their projects
 * Features: Stats overview, project list, and engaging empty state
 */
function CreatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [potentialScore, setPotentialScore] = useState(75);
  const [upiString, setUpiString] = useState(null);
  const [payoutData, setPayoutData] = useState(null);
  const [isLoadingUpi, setIsLoadingUpi] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const projectMenuOpen = Boolean(anchorEl);
  
  // Use ref to track previous score without causing re-renders
  const prevScoreRef = useRef(75);

  // Fetch creator's projects with polling enabled for real-time score updates
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['myProjects'],
    queryFn: fetchMyProjects,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 5000, // Poll every 5 seconds for live score updates
    refetchIntervalInBackground: false, // Stop polling when tab is not active
  });

  // Update potential score when projects data changes
  useEffect(() => {
    if (projects && projects.length > 0) {
      // Get the most recent project's potential score
      const latestProject = projects[0];
      const newScore = latestProject?.potentialScore || 75;
      
      // Use ref to compare with previous score
      const oldScore = prevScoreRef.current;
      
      // Only update if score has changed to trigger animation
      if (newScore !== oldScore) {
        console.log(`🔄 Score updated: ${oldScore} → ${newScore}`);
        
        // Show toast notification for score increase
        if (newScore > oldScore) {
          const increase = (newScore - oldScore).toFixed(1);
          toast.success(`🎉 Your potential score increased by ${increase} points!`, {
            duration: 4000,
            position: 'top-center',
            icon: '📈',
          });
        }
        
        // Update score state to trigger animation
        setPotentialScore(newScore);
        
        // Update ref to new score
        prevScoreRef.current = newScore;
      }
    } else if (projects && projects.length === 0) {
      // Reset to default if no projects
      setPotentialScore(75);
      prevScoreRef.current = 75;
    }
  }, [projects]); // Only depend on projects to avoid infinite loop

  // Handler for opening project selection menu
  const handleOpenProjectMenu = (event) => {
    if (!projects || projects.length === 0) {
      toast.error('No projects available for cash-out');
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  // Handler for closing project menu
  const handleCloseProjectMenu = () => {
    setAnchorEl(null);
  };

  // Handler for UPI cash out for a specific project
  const handleUpiCashOut = async (projectId) => {
    handleCloseProjectMenu();
    setIsLoadingUpi(true);
    setUpiModalOpen(true);

    try {
      const response = await getUpiQrCode(projectId);
      console.log('🔍 UPI Response:', response);

      if (response && response.upiString) {
        setUpiString(response.upiString);
        setPayoutData({
          payoutAmount: response.payoutAmount,
          projectTitle: response.projectTitle,
          creatorName: response.creatorName,
          recipientUpi: response.recipientUpi,
        });
        toast.success('UPI QR Code generated successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Error generating UPI QR:', err);
      toast.error(err.message || 'Failed to generate UPI QR code. Please try again.');
      setUpiModalOpen(false);
    } finally {
      setIsLoadingUpi(false);
    }
  };

  // Handler for closing UPI modal
  const handleCloseUpiModal = () => {
    setUpiModalOpen(false);
    setUpiString(null);
    setPayoutData(null);
  };

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h3" fontWeight={700}>
              Creator Dashboard
            </Typography>
            {/* Live Update Indicator */}
            {projects && projects.length > 0 && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                label="Live Updates Active"
                size="small"
                color="success"
                sx={{
                  height: 24,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                  },
                }}
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name || 'Creator'}! Manage your projects and track performance.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<QrCodeIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleOpenProjectMenu}
            disabled={!projects || projects.length === 0}
            sx={{ fontWeight: 600 }}
          >
            Cash Out to UPI
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={projectMenuOpen}
            onClose={handleCloseProjectMenu}
            PaperProps={{
              sx: {
                minWidth: 320,
                maxHeight: 400,
                mt: 1,
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Select a Project to Cash Out
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Choose which project's earnings to withdraw
              </Typography>
            </Box>
            {projects && projects.map((project) => {
              const payoutAmount = (project.currentFundingInr * 0.15).toFixed(2);
              return (
                <MenuItem
                  key={project._id}
                  onClick={() => handleUpiCashOut(project._id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      bgcolor: 'rgba(0, 191, 165, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <AccountBalanceWalletIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                          {project.title}
                        </Typography>
                        {project.status === 'Live' && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Live"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="secondary.main" fontWeight={600}>
                        ₹{payoutAmount} available
                      </Typography>
                    }
                  />
                </MenuItem>
              );
            })}
          </Menu>
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
        </Stack>
      </Box>

      {/* Potential Score Card - Featured */}
      {projects && projects.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <PotentialScoreDisplay score={potentialScore} reasons={[]} />
        </Box>
      )}

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
            <Grid item xs={12} sm={6} md={4} key={project._id || project.id}>
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
      
      {/* UPI Cash Out Modal */}
      <UpiCashOutModal
        open={upiModalOpen}
        onClose={handleCloseUpiModal}
        upiString={upiString}
        payoutData={payoutData}
        isLoading={isLoadingUpi}
      />
    </Container>
  );
}

export default CreatorDashboard;
