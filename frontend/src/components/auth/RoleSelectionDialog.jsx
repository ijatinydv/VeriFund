import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Button,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useState } from 'react';

/**
 * Role Selection Dialog
 * Allows new users to choose their role: Creator or Investor
 */
function RoleSelectionDialog({ open, onSelectRole, onClose }) {
  // State for consent checkbox
  const [hasConsented, setHasConsented] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Handle role card click - select role but don't submit yet
  const handleRoleClick = (roleValue) => {
    setSelectedRole(roleValue);
  };

  // Handle final registration - only enabled when consent is given
  const handleCompleteRegistration = () => {
    if (hasConsented && selectedRole) {
      onSelectRole(selectedRole);
      // Reset state for next time
      setHasConsented(false);
      setSelectedRole(null);
    }
  };

  const roles = [
    {
      value: 'Creator',
      title: 'I\'m a Creator',
      description: 'Launch projects, raise funds, and bring your ideas to life on the blockchain',
      icon: <RocketLaunchIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      benefits: [
        'Create and manage projects',
        'Raise funds from investors',
        'Issue security tokens',
        'Track project progress',
      ],
    },
    {
      value: 'Investor',
      title: 'I\'m an Investor',
      description: 'Discover and invest in verified projects with transparent funding',
      icon: <AccountBalanceIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      benefits: [
        'Browse verified projects',
        'Invest in promising ideas',
        'Receive security tokens',
        'Track your investments',
      ],
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'background.paper',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Welcome to VeriFund! 🎉
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose your role to get started
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {roles.map((role) => (
            <Grid item xs={12} md={6} key={role.value}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '2px solid',
                  borderColor: selectedRole === role.value 
                    ? (role.value === 'Creator' ? 'primary.main' : 'secondary.main')
                    : 'divider',
                  backgroundColor: selectedRole === role.value 
                    ? (role.value === 'Creator' ? 'primary.50' : 'secondary.50')
                    : 'background.paper',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: role.value === 'Creator' ? 'primary.main' : 'secondary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleRoleClick(role.value)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ mb: 2 }}>
                      {role.icon}
                    </Box>
                    
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {role.title}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3, minHeight: 48 }}
                    >
                      {role.description}
                    </Typography>
                    
                    <Box sx={{ textAlign: 'left' }}>
                      {role.benefits.map((benefit, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                            '&:before': {
                              content: '"✓"',
                              display: 'inline-block',
                              width: 20,
                              color: role.value === 'Creator' ? 'primary.main' : 'secondary.main',
                              fontWeight: 600,
                              mr: 1,
                            },
                          }}
                        >
                          {benefit}
                        </Typography>
                      ))}
                    </Box>
                    
                    {/* Removed the individual button from each card */}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Compliance-First: Consent Checkbox */}
        <Box sx={{ mt: 4, mb: 2, p: 3, backgroundColor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasConsented}
                onChange={(e) => setHasConsented(e.target.checked)}
                name="consent"
                color="primary"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                I consent to the processing of my data on-chain for compliance purposes as per the{' '}
                <Typography component="span" variant="body2" color="primary" fontWeight={600}>
                  VeriFund Privacy Policy
                </Typography>
                {' '}and India's{' '}
                <Typography component="span" variant="body2" color="primary" fontWeight={600}>
                  Digital Personal Data Protection (DPDP) Act, 2023
                </Typography>
                . I understand that my consent will be permanently recorded on the Sepolia blockchain for regulatory compliance and audit purposes.
              </Typography>
            }
          />
        </Box>

        {/* Complete Registration Button */}
        <Button
          onClick={handleCompleteRegistration}
          disabled={!hasConsented || !selectedRole}
          variant="contained"
          color={selectedRole === 'Creator' ? 'primary' : 'secondary'}
          fullWidth
          size="large"
          sx={{ 
            mt: 2,
            fontWeight: 600,
            opacity: (!hasConsented || !selectedRole) ? 0.5 : 1,
          }}
        >
          {!selectedRole 
            ? 'Select a role above' 
            : !hasConsented 
              ? 'Please provide consent to continue'
              : `Complete Registration as ${selectedRole}`
          }
        </Button>
        
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', mt: 3 }}
        >
          Don't worry, you can always create a new account with a different wallet for another role
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

export default RoleSelectionDialog;
