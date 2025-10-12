import {
  Box,
  Button,
  Typography,
  Stack,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Step 3: Review and Submit
 * Final review of project data before submission
 */
function Step3_Review({ data, onBack, onSubmit, isSubmitting }) {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Review Your Project
        </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please review all details carefully before submitting
      </Typography>

      <Stack spacing={3}>
        {/* Project Details Card */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
              Project Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Title
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {data.title}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body2">
                  {data.description}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Category
                  </Typography>
                  <Chip label={data.category} size="small" color="primary" sx={{ mt: 0.5 }} />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Funding Goal
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="secondary.main">
                    {formatCurrency(data.fundingGoalInr)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {data.fundingDuration} days
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Profile Links Card */}
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
              Profile Links
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              {data.githubUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    GitHub
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {data.githubUrl}
                  </Typography>
                </Box>
              )}

              {data.linkedinUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    LinkedIn
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {data.linkedinUrl}
                  </Typography>
                </Box>
              )}

              {data.portfolioUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Portfolio
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {data.portfolioUrl}
                  </Typography>
                </Box>
              )}

              {data.twitterUrl && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Twitter/X
                  </Typography>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                    {data.twitterUrl}
                  </Typography>
                </Box>
              )}

              {!data.githubUrl && !data.linkedinUrl && !data.portfolioUrl && !data.twitterUrl && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No profile links added
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Submission Notice */}
        <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'rgba(0, 191, 165, 0.05)' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              By submitting this project, you confirm that all information provided is accurate
              and you agree to our terms of service. Your project will be reviewed and assigned
              an AI potential score before being published.
            </Typography>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
            onClick={onSubmit}
            disabled={isSubmitting}
            sx={{ fontWeight: 600, minWidth: 200 }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Project'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default Step3_Review;
