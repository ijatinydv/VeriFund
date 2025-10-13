import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  InputAdornment,
  Alert,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';
import BrushIcon from '@mui/icons-material/Brush';

/**
 * Step 2: Link External Profiles
 * Optional step for adding social and professional links
 */
function Step2_LinkProfiles({ data, onUpdate, onNext, onBack }) {
  const [formData, setFormData] = useState({
    githubUrl: data.githubUrl || '',
    linkedinUrl: data.linkedinUrl || '',
    portfolioUrl: data.portfolioUrl || '',
    twitterUrl: data.twitterUrl || '',
    dribbbleUrl: data.dribbbleUrl || '',
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle next button
  const handleNext = () => {
    onUpdate(formData);
    onNext();
  };

  // Calculate completion percentage
  const filledFields = Object.values(formData).filter(value => value.trim() !== '').length;
  const totalFields = Object.keys(formData).length;
  const completionPercent = Math.round((filledFields / totalFields) * 100);

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Link Your Profiles
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Connect your professional profiles to build credibility with investors
      </Typography>

      {/* Gamification - Profile Strength Indicator */}
      {filledFields > 0 && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600}>
            🎯 Profile Strength: {completionPercent}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {filledFields} of {totalFields} profiles linked • 
            {completionPercent === 100 
              ? ' Amazing! Your profile is complete!' 
              : ` Add ${totalFields - filledFields} more to maximize your credibility`
            }
          </Typography>
        </Alert>
      )}

      <Stack spacing={3}>
        {/* GitHub */}
        <TextField
          fullWidth
          label="GitHub Profile"
          name="githubUrl"
          value={formData.githubUrl}
          onChange={handleChange}
          placeholder="https://github.com/yourusername"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <GitHubIcon />
              </InputAdornment>
            ),
          }}
          helperText="Link to your GitHub profile to showcase your technical work"
        />

        {/* LinkedIn */}
        <TextField
          fullWidth
          label="LinkedIn Profile"
          name="linkedinUrl"
          value={formData.linkedinUrl}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/yourusername"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkedInIcon />
              </InputAdornment>
            ),
          }}
          helperText="Professional profile for networking and credibility"
        />

        {/* Portfolio */}
        <TextField
          fullWidth
          label="Portfolio Website"
          name="portfolioUrl"
          value={formData.portfolioUrl}
          onChange={handleChange}
          placeholder="https://yourwebsite.com"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LanguageIcon />
              </InputAdornment>
            ),
          }}
          helperText="Personal website or portfolio showcasing your work"
        />

        {/* Twitter */}
        <TextField
          fullWidth
          label="Twitter/X Profile"
          name="twitterUrl"
          value={formData.twitterUrl}
          onChange={handleChange}
          placeholder="https://twitter.com/yourusername"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <TwitterIcon />
              </InputAdornment>
            ),
          }}
          helperText="Social media presence and community engagement"
        />

        {/* Dribbble */}
        <TextField
          fullWidth
          label="Dribbble Profile"
          name="dribbbleUrl"
          value={formData.dribbbleUrl}
          onChange={handleChange}
          placeholder="https://dribbble.com/yourusername"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BrushIcon />
              </InputAdornment>
            ),
          }}
          helperText="Perfect for designers and creative professionals"
        />

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            sx={{ fontWeight: 600 }}
          >
            Next: Review
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default Step2_LinkProfiles;
