import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Box,
  TextField,
  MenuItem,
  Button,
  Typography,
  InputAdornment,
  Chip,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { suggestPrice } from '../../../services/api';

const categories = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Social Impact',
  'Entertainment',
  'Gaming',
  'Other',
];

/**
 * Step 1: Project Details Form
 * Collects basic project information
 */
function Step1_ProjectDetails({ data, onUpdate, onNext }) {
  const [formData, setFormData] = useState({
    title: data.title || '',
    description: data.description || '',
    category: data.category || '',
    fundingGoalInr: data.fundingGoalInr || '',
    fundingDuration: data.fundingDuration || 30,
    revenueSharePercent: data.revenueSharePercent || '',
  });

  const [errors, setErrors] = useState({});
  const [priceSuggestion, setPriceSuggestion] = useState(null);

  // AI Price Suggestion Mutation
  const priceSuggestionMutation = useMutation({
    mutationFn: (projectData) => suggestPrice(projectData),
    onSuccess: (data) => {
      setPriceSuggestion(data);
      toast.success('AI price suggestion generated!', {
        icon: '💡',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to get price suggestion');
    },
  });

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.fundingGoalInr) {
      newErrors.fundingGoalInr = 'Funding goal is required';
    } else if (formData.fundingGoalInr < 10000) {
      newErrors.fundingGoalInr = 'Minimum funding goal is ₹10,000';
    }

    if (!formData.fundingDuration) {
      newErrors.fundingDuration = 'Funding duration is required';
    } else if (formData.fundingDuration < 7 || formData.fundingDuration > 90) {
      newErrors.fundingDuration = 'Duration must be between 7 and 90 days';
    }

    if (!formData.revenueSharePercent) {
      newErrors.revenueSharePercent = 'Revenue share percentage is required';
    } else if (formData.revenueSharePercent < 0 || formData.revenueSharePercent > 100) {
      newErrors.revenueSharePercent = 'Revenue share must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle next button
  const handleNext = () => {
    if (validate()) {
      onUpdate(formData);
      onNext();
    }
  };

  // Handle AI Price Suggestion
  const handleGetPriceSuggestion = () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in title, description, and category first');
      return;
    }

    priceSuggestionMutation.mutate({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      fundingDuration: formData.fundingDuration,
    });
  };

  // Apply suggested price
  const applySuggestedPrice = (price) => {
    setFormData((prev) => ({
      ...prev,
      fundingGoalInr: price,
    }));
    toast.success('Suggested price applied!');
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Tell us about your project
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Provide clear and compelling details to attract potential investors
      </Typography>

      <Stack spacing={3}>
        {/* Project Title */}
        <TextField
          fullWidth
          label="Project Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={!!errors.title}
          helperText={errors.title || 'A catchy, descriptive title for your project'}
          placeholder="e.g., Revolutionary AI-Powered Financial Planning App"
        />

        {/* Description */}
        <TextField
          fullWidth
          multiline
          rows={6}
          label="Project Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          error={!!errors.description}
          helperText={
            errors.description ||
            `${formData.description.length}/500 - Explain what your project does and why it matters`
          }
          placeholder="Describe your project's mission, target audience, and unique value proposition..."
          inputProps={{ maxLength: 500 }}
        />

        {/* Category */}
        <TextField
          fullWidth
          select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          error={!!errors.category}
          helperText={errors.category || 'Select the most relevant category'}
        >
          {categories.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        {/* Funding Goal */}
        <Box>
          <TextField
            fullWidth
            type="number"
            label="Funding Goal"
            name="fundingGoalInr"
            value={formData.fundingGoalInr}
            onChange={handleChange}
            error={!!errors.fundingGoalInr}
            helperText={errors.fundingGoalInr || 'Amount you need to raise (in INR)'}
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            }}
            placeholder="100000"
          />
          
          {/* AI Price Suggestion Button */}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={
              priceSuggestionMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            onClick={handleGetPriceSuggestion}
            disabled={priceSuggestionMutation.isPending || !formData.title || !formData.description || !formData.category}
            sx={{ mt: 1, fontWeight: 600 }}
            size="small"
          >
            {priceSuggestionMutation.isPending ? 'Analyzing...' : 'Get AI Price Suggestion'}
          </Button>

          {/* Price Suggestion Display */}
          {priceSuggestion && (
            <Alert
              severity="info"
              icon={<AutoAwesomeIcon />}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              <Typography variant="body2" fontWeight={600} gutterBottom>
                AI-Powered Funding Goal Suggestion
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Based on your project details, we recommend a funding range:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip
                  label={`Min: ₹${priceSuggestion.minPrice?.toLocaleString('en-IN') || 'N/A'}`}
                  color="secondary"
                  size="small"
                  onClick={() => applySuggestedPrice(priceSuggestion.minPrice)}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
                <Chip
                  label={`Recommended: ₹${priceSuggestion.suggestedPrice?.toLocaleString('en-IN') || 'N/A'}`}
                  color="primary"
                  size="small"
                  onClick={() => applySuggestedPrice(priceSuggestion.suggestedPrice)}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
                <Chip
                  label={`Max: ₹${priceSuggestion.maxPrice?.toLocaleString('en-IN') || 'N/A'}`}
                  color="secondary"
                  size="small"
                  onClick={() => applySuggestedPrice(priceSuggestion.maxPrice)}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                💡 Click on any amount to apply it to your funding goal
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Funding Duration */}
        <TextField
          fullWidth
          type="number"
          label="Funding Duration"
          name="fundingDuration"
          value={formData.fundingDuration}
          onChange={handleChange}
          error={!!errors.fundingDuration}
          helperText={errors.fundingDuration || 'Number of days to keep funding open (7-90 days)'}
          InputProps={{
            endAdornment: <InputAdornment position="end">days</InputAdornment>,
          }}
          inputProps={{ min: 7, max: 90 }}
        />

        {/* Revenue Share Percentage */}
        <TextField
          fullWidth
          type="number"
          label="Revenue Share Percentage"
          name="revenueSharePercent"
          value={formData.revenueSharePercent}
          onChange={handleChange}
          error={!!errors.revenueSharePercent}
          helperText={errors.revenueSharePercent || 'Percentage of revenue to share with investors (0-100%)'}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
          placeholder="10"
        />

        {/* Next Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            sx={{ fontWeight: 600 }}
          >
            Next: Link Profiles
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}

export default Step1_ProjectDetails;
