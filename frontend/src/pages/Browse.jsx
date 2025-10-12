import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert,
  AlertTitle,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Card,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ProjectCard from '../components/project/ProjectCard';
import ProjectCardSkeleton from '../components/project/ProjectCardSkeleton';
import { fetchProjects } from '../services/api';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

/**
 * Browse Projects Page
 * Displays a grid of projects with filtering and search capabilities
 * Uses TanStack Query for data fetching and caching
 */
function Browse() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch projects using TanStack Query
  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => fetchProjects(), // Remove status filter to show all projects
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 2, // Retry failed requests twice
  });

  // Filter projects based on search query
  const filteredProjects = projects?.filter((project) =>
    project.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h3"
          fontWeight={700}
          gutterBottom
          sx={{
            background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Browse Projects
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover innovative projects seeking funding through our AI-powered platform.
          Invest in the future today.
        </Typography>
      </Box>

      {/* Search and Filter Bar */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            sx={{ minWidth: 120 }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Loading State - Skeleton Loaders */}
      {isLoading && (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <ProjectCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error State */}
      {isError && (
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%',
            },
          }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Failed to Load Projects</AlertTitle>
          {error?.message || 'An unexpected error occurred. Please try again later.'}
        </Alert>
      )}

      {/* Success State - Projects Grid */}
      {!isLoading && !isError && (
  <>
    {filteredProjects && filteredProjects.length > 0 ? (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        </Typography>
        <Grid container spacing={3}>
          {filteredProjects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      </>
    ) : (
      // Enhanced Empty State
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
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'rgba(0, 191, 165, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          {searchQuery ? (
            <SearchIcon sx={{ fontSize: 50, color: 'secondary.main' }} />
          ) : (
            <FolderOpenIcon sx={{ fontSize: 50, color: 'secondary.main' }} />
          )}
        </Box>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          {searchQuery ? 'No Projects Found' : 'No Projects Available'}
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
          {searchQuery
            ? `No projects match "${searchQuery}". Try adjusting your search or clear the filter to see all available projects.`
            : 'There are no projects currently seeking funding. Check back soon for exciting new opportunities!'}
        </Typography>

        {searchQuery && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setSearchQuery('')}
            sx={{ fontWeight: 600 }}
          >
            Clear Search
          </Button>
        )}
      </Card>
    )}
  </>
)}
    </Container>
  );
}

export default Browse;
