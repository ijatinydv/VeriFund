import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Button,
  Stack,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PercentIcon from '@mui/icons-material/Percent';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

/**
 * InvestmentCard Component
 * Displays a single investment with project details
 * Shows: Project info, investment amount, share percentage, returns
 */
function InvestmentCard({ investment }) {
  const navigate = useNavigate();
  const [elevation, setElevation] = useState(2);

  // Destructure investment data
  const {
    project,
    amountInr,
    sharePercent,
    createdAt,
    _id,
  } = investment;

  // Handle case where project might not be populated
  if (!project) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, opacity: 0.6 }}>
        <CardContent>
          <Typography color="text.secondary">
            Project data not available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Calculate investment metrics
  const fundingProgress = project.fundingGoalInr > 0 
    ? Math.round((project.currentFundingInr / project.fundingGoalInr) * 100)
    : 0;

  // Calculate potential returns (simplified - actual returns would be based on revenue)
  const potentialReturn = amountInr * 1.5; // Example: 50% potential return
  const estimatedROI = 50; // Example: 50% ROI

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Live':
        return 'success';
      case 'Funding':
        return 'warning';
      case 'Completed':
        return 'info';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      Technology: 'primary',
      Healthcare: 'error',
      Education: 'warning',
      Finance: 'success',
      'E-commerce': 'secondary',
      Other: 'default',
    };
    return colors[category] || 'default';
  };

  // Navigate to project details
  const handleViewProject = () => {
    navigate(`/project/${project._id}`);
  };

  return (
    <Card
      elevation={elevation}
      onMouseEnter={() => setElevation(8)}
      onMouseLeave={() => setElevation(2)}
      sx={{
        borderRadius: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.02) 0%, rgba(0, 191, 165, 0.02) 100%)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(0, 191, 165, 0.3)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* Header with Project Image/Icon */}
        <Box sx={{ mb: 2 }}>
          {project.imageUrl && project.imageUrl !== 'https://via.placeholder.com/400x300/0D47A1/FFFFFF?text=Project+Image' ? (
            <Box
              component="img"
              src={project.imageUrl}
              alt={project.title}
              sx={{
                width: '100%',
                height: 160,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 2,
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: 160,
                borderRadius: 2,
                mb: 2,
                background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.1) 0%, rgba(0, 191, 165, 0.1) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'secondary.main', opacity: 0.5 }} />
            </Box>
          )}
        </Box>

        {/* Project Title and Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              flexGrow: 1,
              cursor: 'pointer',
              '&:hover': { color: 'secondary.main' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
            onClick={handleViewProject}
          >
            {project.title}
          </Typography>
          <Tooltip title={`Project Status: ${project.status}`}>
            <IconButton size="small" sx={{ ml: 1 }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Category and Status Chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={project.category}
            size="small"
            color={getCategoryColor(project.category)}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={project.status}
            size="small"
            color={getStatusColor(project.status)}
            sx={{ fontWeight: 600 }}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Investment Amount */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccountBalanceWalletIcon sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary">
              Your Investment
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            {formatCurrency(amountInr)}
          </Typography>
        </Box>

        {/* Share Percentage */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PercentIcon sx={{ fontSize: 20, mr: 1, color: 'secondary.main' }} />
            <Typography variant="body2" color="text.secondary">
              Revenue Share
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" fontWeight={700} color="secondary.main">
              {sharePercent.toFixed(2)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              of project revenue
            </Typography>
          </Box>
        </Box>

        {/* Funding Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Funding Progress
            </Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {fundingProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(fundingProgress, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(13, 71, 161, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: fundingProgress >= 100
                  ? 'linear-gradient(90deg, #00C853 0%, #64DD17 100%)'
                  : 'linear-gradient(90deg, #0D47A1 0%, #00BFA5 100%)',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {formatCurrency(project.currentFundingInr)} of {formatCurrency(project.fundingGoalInr)}
          </Typography>
        </Box>

        {/* Potential Returns */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, rgba(0, 200, 83, 0.05) 100%)',
            border: '1px solid rgba(0, 200, 83, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 20, mr: 1, color: 'success.main' }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Potential Returns
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={700} color="success.main">
            {formatCurrency(potentialReturn)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Est. {estimatedROI}% ROI
          </Typography>
        </Box>

        {/* Investment Date */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            Invested on {formatDate(createdAt)}
          </Typography>
        </Box>
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          endIcon={<OpenInNewIcon />}
          onClick={handleViewProject}
          sx={{ fontWeight: 600 }}
        >
          View Project
        </Button>
      </CardActions>
    </Card>
  );
}

InvestmentCard.propTypes = {
  investment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    project: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      category: PropTypes.string,
      status: PropTypes.string.isRequired,
      currentFundingInr: PropTypes.number,
      fundingGoalInr: PropTypes.number,
      imageUrl: PropTypes.string,
    }),
    amountInr: PropTypes.number.isRequired,
    sharePercent: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default InvestmentCard;
