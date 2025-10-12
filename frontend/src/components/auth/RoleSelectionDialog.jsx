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
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

/**
 * Role Selection Dialog
 * Allows new users to choose their role: Creator or Investor
 */
function RoleSelectionDialog({ open, onSelectRole, onClose }) {
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
                  borderColor: 'divider',
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: role.value === 'Creator' ? 'primary.main' : 'secondary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => onSelectRole(role.value)}
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
                    
                    <Button
                      variant="contained"
                      color={role.value === 'Creator' ? 'primary' : 'secondary'}
                      fullWidth
                      sx={{ mt: 3, fontWeight: 600 }}
                    >
                      Continue as {role.value}
                    </Button>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        
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
