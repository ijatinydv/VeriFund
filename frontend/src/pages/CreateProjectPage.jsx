import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import Step1_ProjectDetails from '../components/project/create/Step1_ProjectDetails';
import Step2_LinkProfiles from '../components/project/create/Step2_LinkProfiles';
import Step3_Review from '../components/project/create/Step3_Review';
import { createProject } from '../services/api';

const steps = ['Project Details', 'Link Profiles', 'Review & Submit'];

/**
 * CreateProjectPage Component
 * Multi-step wizard for creators to submit new projects
 * Protected route - only accessible to authenticated creators
 */
function CreateProjectPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [projectData, setProjectData] = useState({
    // Step 1: Project Details
    title: '',
    description: '',
    category: '',
    fundingGoalInr: '',
    fundingDuration: 30,
    revenueSharePercent: '',
    
    // Step 2: Profile Links
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    twitterUrl: '',
    
    // Additional fields
    imageUrl: '',
    tags: [],
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // TanStack Query mutation for project creation
  const createProjectMutation = useMutation({
    mutationFn: (data) => createProject(data),
    onSuccess: (data) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['myProjects'] });
      
      // Show success toast
      toast.success('🎉 Project created successfully!', {
        duration: 5000,
      });
      
      console.log('Project created successfully:', data);
      
      // Navigate to project page after 2 seconds
      setTimeout(() => {
        navigate(`/project/${data.id}`);
      }, 2000);
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Failed to create project. Please try again.');
    },
  });

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // Handle previous step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle form data update
  const handleUpdateData = (stepData) => {
    setProjectData((prev) => ({
      ...prev,
      ...stepData,
    }));
  };

  // Handle final submission
  const handleSubmit = () => {
    createProjectMutation.mutate(projectData);
  };

  // Get step content based on active step
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Step1_ProjectDetails
            data={projectData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <Step2_LinkProfiles
            data={projectData}
            onUpdate={handleUpdateData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <Step3_Review
            data={projectData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={createProjectMutation.isPending}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        {/* Header */}
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
          sx={{
            background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            mb: 1,
          }}
        >
          Create New Project
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" paragraph>
          Submit your project to receive funding from investors worldwide
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Success Message */}
        {createProjectMutation.isSuccess && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              Project Created Successfully!
            </Typography>
            <Typography variant="body2">
              Redirecting to your project page...
            </Typography>
          </Alert>
        )}

        {/* Error Message */}
        {createProjectMutation.isError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>
              Failed to Create Project
            </Typography>
            <Typography variant="body2">
              {createProjectMutation.error?.message || 'An unexpected error occurred. Please try again.'}
            </Typography>
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>
      </Paper>
    </Container>
  );
}

export default CreateProjectPage;
