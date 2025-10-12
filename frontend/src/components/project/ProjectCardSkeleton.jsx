import { Card, CardContent, Skeleton, Box } from '@mui/material';

/**
 * ProjectCardSkeleton Component
 * Displays a loading placeholder for ProjectCard
 * Uses MUI Skeleton with shimmer animation
 */
function ProjectCardSkeleton() {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.paper',
        borderRadius: 3,
      }}
    >
      {/* Image Skeleton */}
      <Skeleton
        variant="rectangular"
        height={200}
        animation="wave"
        sx={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Category and Score Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="rounded" width={80} height={24} animation="wave" />
          <Skeleton variant="rounded" width={70} height={24} animation="wave" />
        </Box>

        {/* Title Skeleton */}
        <Skeleton variant="text" height={32} animation="wave" sx={{ mb: 1 }} />

        {/* Description Skeleton */}
        <Skeleton variant="text" height={20} animation="wave" />
        <Skeleton variant="text" height={20} width="80%" animation="wave" sx={{ mb: 2 }} />

        {/* Creator Skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={18} height={18} animation="wave" sx={{ mr: 1 }} />
          <Skeleton variant="text" width={100} height={20} animation="wave" />
        </Box>

        {/* Funding Progress Skeleton */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Skeleton variant="text" width={80} height={20} animation="wave" />
            <Skeleton variant="text" width={80} height={20} animation="wave" />
          </Box>
          <Skeleton variant="rounded" height={8} animation="wave" sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={150} height={16} animation="wave" />
        </Box>

        {/* Button Skeleton */}
        <Skeleton variant="rounded" height={42} animation="wave" sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );
}

export default ProjectCardSkeleton;
