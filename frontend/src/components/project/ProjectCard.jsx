import { Card, CardContent, CardMedia, Typography, Box, Chip, Button, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';

/**
 * ProjectCard Component
 * Displays a summary of a project in a card format
 * 
 * @param {Object} project - The project data object
 */
function ProjectCard({ project }) {
  const navigate = useNavigate();

  // Calculate funding progress percentage
  const fundingProgress = project.fundingGoal
    ? Math.min((project.currentFunding / project.fundingGoal) * 100, 100)
    : 0;

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Navigate to project detail page
  const handleViewProject = () => {
    navigate(`/project/${project._id || project.id}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 40px rgba(0, 191, 165, 0.2)',
        },
        cursor: 'pointer',
        backgroundColor: 'background.paper',
        borderRadius: 3,
      }}
      onClick={handleViewProject}
    >
      {/* Project Image */}
      <CardMedia
        component="img"
        height="200"
        image={project.imageUrl || 'https://via.placeholder.com/400x200?text=Project+Image'}
        alt={project.title}
        sx={{
          objectFit: 'cover',
        }}
      />

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category and Score */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Chip
            label={project.category || 'Technology'}
            size="small"
            sx={{
              backgroundColor: 'rgba(13, 71, 161, 0.1)',
              color: 'primary.main',
              fontWeight: 600,
            }}
          />
          {project.potentialScore && (
            <Chip
              icon={<TrendingUpIcon />}
              label={`${project.potentialScore}/100`}
              size="small"
              color="secondary"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Title */}
        <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 1 }}>
          {project.title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            flexGrow: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.description}
        </Typography>

        {/* Creator */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            by {project.creatorName || 'Anonymous'}
          </Typography>
        </Box>

        {/* Funding Progress */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              {formatCurrency(project.currentFunding)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              of {formatCurrency(project.fundingGoal)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={fundingProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #0D47A1 0%, #00BFA5 100%)',
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {Math.round(fundingProgress)}% funded • {project.backers || 0} backers
          </Typography>
        </Box>

        {/* View Button */}
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          sx={{ mt: 2, fontWeight: 600 }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewProject();
          }}
        >
          View Project
        </Button>
      </CardContent>
    </Card>
  );
}

export default ProjectCard;
