import { Box, Container, Typography, Link, Grid, IconButton, Divider } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TelegramIcon from '@mui/icons-material/Telegram';

/**
 * VeriFund Footer Component
 * Contains navigation links, social media, and copyright information
 */
function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand Section */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0D47A1 0%, #00BFA5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
              }}
            >
              VeriFund
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Decentralized micro-investing platform powered by AI and blockchain technology.
              Empowering creators and investors worldwide.
            </Typography>
            {/* Social Media Links */}
            <Box sx={{ mt: 2 }}>
              <IconButton
                aria-label="GitHub"
                sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main' } }}
                href="https://github.com"
                target="_blank"
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                aria-label="Twitter"
                sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main' } }}
                href="https://twitter.com"
                target="_blank"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                aria-label="LinkedIn"
                sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main' } }}
                href="https://linkedin.com"
                target="_blank"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                aria-label="Telegram"
                sx={{ color: 'text.secondary', '&:hover': { color: 'secondary.main' } }}
                href="https://telegram.org"
                target="_blank"
              >
                <TelegramIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Platform
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="text.secondary" underline="hover">
                Home
              </Link>
              <Link href="/browse" color="text.secondary" underline="hover">
                Browse Projects
              </Link>
              <Link href="/creator/dashboard" color="text.secondary" underline="hover">
                For Creators
              </Link>
              <Link href="/investor/dashboard" color="text.secondary" underline="hover">
                For Investors
              </Link>
            </Box>
          </Grid>

          {/* Resources */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="text.secondary" underline="hover">
                Documentation
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Whitepaper
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                API
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Blog
              </Link>
            </Box>
          </Grid>

          {/* Legal */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Legal
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" color="text.secondary" underline="hover">
                Terms of Service
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Privacy Policy
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Cookie Policy
              </Link>
              <Link href="#" color="text.secondary" underline="hover">
                Disclaimer
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Copyright */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} VeriFund. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Built with ❤️ for the future of decentralized finance
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
