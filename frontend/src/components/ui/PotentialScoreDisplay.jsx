import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { Box, Typography, Card, Chip, Stack } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * PotentialScoreDisplay Component
 * 
 * Displays an AI-generated potential score as an animated gauge
 * with explainability features showing key factors
 * 
 * @param {number} score - The potential score from 0-100
 * @param {Array} reasons - Array of reason objects with format:
 *   { feature: string, impact: 'positive' | 'negative', value: string }
 */
function PotentialScoreDisplay({ score = 0, reasons = [] }) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  // Framer Motion count-up animation for the score number
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [previousScore, setPreviousScore] = useState(score);

  // Update displayScore whenever the transformed value changes
  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => {
      setDisplayScore(latest);
    });
    return unsubscribe;
  }, [rounded]);

  // Animate the score number on mount AND when score changes
  useEffect(() => {
    const controls = animate(count, score, {
      duration: hasAnimated ? 1.5 : 2, // Faster animation for updates, slower for initial
      ease: 'easeOut',
    });
    
    if (!hasAnimated) {
      setHasAnimated(true);
    }
    
    if (score !== previousScore) {
      setPreviousScore(score);
    }
    
    return () => controls.stop();
  }, [score, count, hasAnimated, previousScore]); // Re-run animation whenever score changes

  // Prepare data for Recharts RadialBarChart
  const chartData = [
    {
      name: 'Score',
      value: score,
      fill: 'url(#scoreGradient)',
    },
  ];

  // Get color based on score
  const getScoreColor = (value) => {
    if (value >= 75) return '#00C853'; // Green for high scores
    if (value >= 50) return '#FFD600'; // Yellow for medium scores
    return '#FF1744'; // Red for low scores
  };

  // Get score rating label
  const getScoreLabel = (value) => {
    if (value >= 75) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // Display top 3 reasons
  const topReasons = reasons.slice(0, 3);

  return (
    <Card
      elevation={3}
      sx={{
        p: 4,
        borderRadius: 3,
        background: 'linear-gradient(135deg, rgba(13, 71, 161, 0.05) 0%, rgba(0, 191, 165, 0.05) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          AI Potential Score
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Machine learning analysis of project viability
        </Typography>
      </Box>

      {/* Radial Gauge Chart */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          my: 3,
        }}
      >
        <RadialBarChart
          width={300}
          height={300}
          cx={150}
          cy={150}
          innerRadius={80}
          outerRadius={140}
          barSize={32}
          data={chartData}
          startAngle={90}
          endAngle={-270}
        >
          {/* Define gradient for the gauge bar */}
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={score >= 75 ? '#00C853' : score >= 50 ? '#FFD600' : '#FF1744'}
                stopOpacity={1}
              />
              <stop
                offset="100%"
                stopColor={score >= 75 ? '#00BFA5' : score >= 50 ? '#FFA726' : '#D32F2F'}
                stopOpacity={0.8}
              />
            </linearGradient>
          </defs>
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            clockWise
            dataKey="value"
            cornerRadius={10}
            animationBegin={0}
            animationDuration={2000}
            animationEasing="ease-out"
          />
        </RadialBarChart>

        {/* Centered Score Display */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <motion.div>
            <Typography
              variant="h2"
              component="div"
              fontWeight={800}
              sx={{
                color: scoreColor,
                fontSize: '3.5rem',
                lineHeight: 1,
              }}
            >
              {displayScore}
            </Typography>
          </motion.div>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            out of 100
          </Typography>
          <Chip
            icon={<CheckCircleIcon />}
            label={scoreLabel}
            size="small"
            sx={{
              mt: 1,
              backgroundColor: `${scoreColor}20`,
              color: scoreColor,
              fontWeight: 600,
              borderColor: scoreColor,
            }}
          />
        </Box>
      </Box>

      {/* Explainability Section */}
      {topReasons.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Key Factors
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Top factors influencing this score:
          </Typography>

          <Stack spacing={2}>
            {topReasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderColor:
                        reason.impact === 'positive'
                          ? 'rgba(0, 200, 83, 0.3)'
                          : 'rgba(255, 23, 68, 0.3)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Impact Icon */}
                  <Box
                    sx={{
                      mr: 2,
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor:
                        reason.impact === 'positive'
                          ? 'rgba(0, 200, 83, 0.1)'
                          : 'rgba(255, 23, 68, 0.1)',
                    }}
                  >
                    {reason.impact === 'positive' ? (
                      <TrendingUpIcon sx={{ color: '#00C853', fontSize: 24 }} />
                    ) : (
                      <TrendingDownIcon sx={{ color: '#FF1744', fontSize: 24 }} />
                    )}
                  </Box>

                  {/* Feature Details */}
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight={600}>
                      {reason.feature}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {reason.value}
                    </Typography>
                  </Box>

                  {/* Impact Badge */}
                  <Chip
                    label={reason.impact === 'positive' ? 'Positive' : 'Negative'}
                    size="small"
                    sx={{
                      backgroundColor:
                        reason.impact === 'positive'
                          ? 'rgba(0, 200, 83, 0.15)'
                          : 'rgba(255, 23, 68, 0.15)',
                      color: reason.impact === 'positive' ? '#00C853' : '#FF1744',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </motion.div>
            ))}
          </Stack>
        </Box>
      )}

      {/* Footer Note */}
      <Box
        sx={{
          mt: 3,
          pt: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          This score is generated using XGBoost regression analysis on multiple data points
          including market trends, project metrics, and historical performance.
        </Typography>
      </Box>
    </Card>
  );
}

export default PotentialScoreDisplay;
