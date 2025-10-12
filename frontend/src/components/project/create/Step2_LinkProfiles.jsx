import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  InputAdornment,
  Chip,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import LanguageIcon from '@mui/icons-material/Language';

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

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Link Your Profiles
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Connect your professional profiles to build credibility with investors (Optional)
      </Typography>

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
