import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Divider,
  Alert,
  Skeleton,
  Avatar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PotentialScoreDisplay from '../components/ui/PotentialScoreDisplay';
import InvestModal from '../components/ui/InvestModal';
import { fetchProjectById } from '../services/api';
import useAuth from '../hooks/useAuth';

/**
 * ProjectDetailPage Component
 * Displays comprehensive project information and investment options
 * Features AI potential score and Web3 funding capability
 */
function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [investModalOpen, setInvestModalOpen] = useState(false);

  // Fetch project data
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId, // Only run query if projectId exists
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Handle missing projectId
  if (!projectId) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Invalid Project
          </Typography>
          <Typography variant="body2">
            No project ID was provided. Please return to browse and select a project.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/browse')} sx={{ mt: 2 }}>
            Back to Browse
          </Button>
        </Alert>
      </Container>
    );
  }

  // Calculate funding progress
  const fundingProgress = project?.fundingGoal
    ? Math.min((project.currentFunding / project.fundingGoal) * 100, 100)
    : 0;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle invest button click
  const handleInvestClick = () => {
    if (!isAuthenticated) {
      alert('Please connect your wallet to invest');
      return;
    }
    setInvestModalOpen(true);
  };

  // Loading State
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={30} />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Error State
  if (isError) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Failed to Load Project
          </Typography>
          <Typography variant="body2">
            {error?.message || 'An unexpected error occurred. Please try again later.'}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/browse')} sx={{ mt: 2 }}>
            Back to Browse
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Image */}
      <Card sx={{ borderRadius: 3, mb: 4, overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="400"
          image={project.imageUrl || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'%3E%3Crect fill='%230D47A1' width='1200' height='400'/%3E%3Ctext fill='%23ffffff' font-family='Arial' font-size='40' text-anchor='middle' x='600' y='220'%3EProject Banner%3C/text%3E%3C/svg%3E`}
          alt={project.title}
          sx={{ objectFit: 'cover' }}
        />
      </Card>

      <Grid container spacing={4}>
        {/* Left Column - Project Details */}
        <Grid item xs={12} md={8}>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={project.category} color="primary" />
              <Chip
                label={project.status}
                color={project.status === 'Funding' ? 'success' : 'default'}
              />
            </Stack>

            <Typography variant="h3" fontWeight={700} gutterBottom>
              {project.title}
            </Typography>

            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  by <strong>{project.creatorName || 'Anonymous'}</strong>
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Created {formatDate(project.createdAt)}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              About This Project
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              {project.description}
            </Typography>
          </Box>

          {/* Creator Profile Links */}
          {(project.githubUrl || project.linkedinUrl || project.portfolioUrl || project.twitterUrl) && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Creator Links
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {project.githubUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<GitHubIcon />}
                    href={project.githubUrl}
                    target="_blank"
                    size="small"
                  >
                    GitHub
                  </Button>
                )}
                {project.linkedinUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<LinkedInIcon />}
                    href={project.linkedinUrl}
                    target="_blank"
                    size="small"
                  >
                    LinkedIn
                  </Button>
                )}
                {project.portfolioUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<LanguageIcon />}
                    href={project.portfolioUrl}
                    target="_blank"
                    size="small"
                  >
                    Portfolio
                  </Button>
                )}
                {project.twitterUrl && (
                  <Button
                    variant="outlined"
                    startIcon={<TwitterIcon />}
                    href={project.twitterUrl}
                    target="_blank"
                    size="small"
                  >
                    Twitter
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          {/* AI Potential Score */}
          {project.potentialScore && project.scoreReasons && (
            <Box sx={{ mb: 4 }}>
              <PotentialScoreDisplay
                score={project.potentialScore}
                reasons={project.scoreReasons}
              />
            </Box>
          )}
        </Grid>

        {/* Right Column - Funding Info */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{
              position: 'sticky',
              top: 100,
              borderRadius: 3,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Funding Progress */}
              <Typography variant="h4" fontWeight={700} color="secondary.main" gutterBottom>
                {formatCurrency(project.currentFunding || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                pledged of {formatCurrency(project.fundingGoal)} goal
              </Typography>

              <LinearProgress
                variant="determinate"
                value={fundingProgress}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  my: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: 'linear-gradient(90deg, #0D47A1 0%, #00BFA5 100%)',
                  },
                }}
              />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {Math.round(fundingProgress)}% funded
              </Typography>

              <Divider sx={{ my: 3 }} />

              {/* Stats */}
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {project.backers || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    backers
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {project.fundingDuration || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    days remaining
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              {/* Investment Button */}
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                size="large"
                startIcon={<AccountBalanceWalletIcon />}
                onClick={handleInvestClick}
                disabled={project.status !== 'Funding'}
                sx={{
                  fontWeight: 600,
                  py: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                {project.status === 'Funding' ? 'Fund This Project' : 'Funding Closed'}
              </Button>

              {/* Contract Address */}
              {project.splitterContractAddress && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Smart Contract
                  </Typography>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {project.splitterContractAddress}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Investment Modal */}
      <InvestModal
        open={investModalOpen}
        onClose={() => setInvestModalOpen(false)}
        project={project}
      />
    </Container>
  );
}

export default ProjectDetailPage;
