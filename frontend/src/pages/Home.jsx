import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SecurityIcon from '@mui/icons-material/Security';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import useAuth from '../hooks/useAuth';

/**
 * Home Component - VeriFund Landing Page
 * Features hero section, benefits, how it works, stats, and CTAs
 */
function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  // Features data
  const features = [
    {
      icon: <AutoGraphIcon sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Scoring',
      description:
        'Advanced machine learning algorithms analyze projects and predict success potential with 85%+ accuracy.',
      color: '#00BFA5',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Blockchain Security',
      description:
        'Smart contracts ensure transparent, secure, and automated fund distribution with immutable records.',
      color: '#0D47A1',
    },
    {
      icon: <AccountBalanceWalletIcon sx={{ fontSize: 40 }} />,
      title: 'Micro-Investing',
      description:
        'Start investing with as little as $10. No minimum thresholds, making investment accessible to everyone.',
      color: '#FFD600',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      title: 'Revenue Sharing',
      description:
        'Earn automatic revenue share from successful projects. Transparent tracking and instant payouts.',
      color: '#00C853',
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
      title: 'Verified Creators',
      description:
        'All creators undergo verification and projects receive AI credibility scores before listing.',
      color: '#00B8D4',
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 40 }} />,
      title: 'Global Reach',
      description:
        'Connect with investors and creators worldwide. No geographical barriers in the decentralized economy.',
      color: '#FF6F00',
    },
  ];

  // How it works steps
  const steps = [
    {
      number: '01',
      title: 'Connect Wallet',
      description: 'Sign up with your Web3 wallet in seconds. MetaMask, WalletConnect, and more supported.',
    },
    {
      number: '02',
      title: 'Browse Projects',
      description: 'Explore AI-scored projects with detailed analytics, creator profiles, and success predictions.',
    },
    {
      number: '03',
      title: 'Invest with Crypto',
      description: 'Fund projects directly using ETH. Smart contracts handle everything automatically.',
    },
    {
      number: '04',
      title: 'Earn Returns',
      description: 'Receive automatic revenue share as projects succeed. Track earnings in real-time.',
    },
  ];

  // Platform stats
  const stats = [
    { value: '₹50M+', label: 'Total Funded' },
    { value: '2,500+', label: 'Projects Launched' },
    { value: '15,000+', label: 'Active Investors' },
    { value: '85%', label: 'Success Rate' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.1) 0%, rgba(0, 191, 165, 0.1) 100%)',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.6 }}
              >
                <Chip
                  label="🚀 AI-Powered Decentralized Funding"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(0, 191, 165, 0.1)',
                    color: 'secondary.main',
                    fontWeight: 600,
                    borderColor: 'secondary.main',
                  }}
                  variant="outlined"
                />

                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                    fontWeight: 800,
                    lineHeight: 1.2,
                    mb: 3,
                  }}
                >
                  Fund the Future with{' '}
                  <Box
                    component="span"
                    sx={{
                      background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    AI & Blockchain
                  </Box>
                </Typography>

                <Typography
                  variant="h5"
                  color="text.secondary"
                  paragraph
                  sx={{
                    mb: 4,
                    lineHeight: 1.6,
                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                  }}
                >
                  Discover promising projects scored by AI, invest with crypto, and earn revenue share.
                  The next generation of crowdfunding is here.
                </Typography>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/browse')}
                    sx={{
                      fontWeight: 600,
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      boxShadow: '0 8px 32px 0 rgba(0, 191, 165, 0.37)',
                    }}
                  >
                    Explore Projects
                  </Button>
                  {!isAuthenticated && (
                    <Button
                      variant="outlined"
                      color="secondary"
                      size="large"
                      onClick={() => navigate('/create-project')}
                      sx={{
                        fontWeight: 600,
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                        },
                      }}
                    >
                      List Your Project
                    </Button>
                  )}
                </Stack>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Animated circles */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      border: '2px solid rgba(0, 191, 165, 0.3)',
                      animation: 'pulse 3s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
                        '50%': { transform: 'scale(1.1)', opacity: 0.2 },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      width: '70%',
                      height: '70%',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 20px 60px rgba(0, 191, 165, 0.4)',
                    }}
                  >
                    <RocketLaunchIcon sx={{ fontSize: 120, color: 'white' }} />
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                      background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography variant="h2" fontWeight={700} gutterBottom>
                Why Choose VeriFund?
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
                Combining the power of artificial intelligence and blockchain technology to revolutionize
                how projects get funded
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <motion.div variants={fadeInUp}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: `0 12px 40px ${feature.color}33`,
                          borderColor: feature.color,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 70,
                          height: 70,
                          borderRadius: 2,
                          bgcolor: `${feature.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          color: feature.color,
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.description}
                      </Typography>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" fontWeight={700} gutterBottom>
            How It Works
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Get started in minutes and join thousands of investors backing innovative projects
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {steps.map((step, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Box sx={{ position: 'relative', textAlign: 'center' }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      fontSize: '4rem',
                      color: 'rgba(0, 191, 165, 0.15)',
                      mb: 2,
                    }}
                  >
                    {step.number}
                  </Typography>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {step.description}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Final CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
          py: { xs: 8, md: 12 },
          color: 'white',
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" fontWeight={700} gutterBottom sx={{ color: 'white' }}>
                Ready to Get Started?
              </Typography>
              <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9, color: 'white' }}>
                Join VeriFund today and be part of the decentralized funding revolution
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/browse')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 600,
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                  endIcon={<ArrowForwardIcon />}
                >
                  Start Investing
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/create-project')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Create Project
                </Button>
              </Stack>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;
