import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export default function Logo({ variant = 'full', mode = 'auto' }) {
  const theme = useTheme();

  // If mode is auto, we check the current theme mode. Otherwise we force the provided mode.
  const isDark = mode === 'auto' ? theme.palette.mode === 'dark' : mode === 'dark';

  const primaryColor = isDark ? theme.palette.primary.light : theme.palette.primary.main;
  const textColor = isDark ? '#ffffff' : theme.palette.text.primary;
  const secondaryColor = isDark ? 'rgba(255, 255, 255, 0.7)' : theme.palette.text.secondary;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* ── Icon ── */}
      <Box
        component="svg"
        viewBox="0 0 48 48"
        sx={{
          width: 36,
          height: 36,
          minWidth: 36,
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
        }}
      >
        <rect width="48" height="48" rx="10" fill={primaryColor} />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 12C17.3726 12 12 17.3726 12 24C12 30.6274 17.3726 36 24 36C30.6274 36 36 30.6274 36 24C36 17.3726 30.6274 12 24 12ZM21 16L17 20L21 24H25L21 16ZM29 20L25 16L21 24H25L29 20ZM27 32L31 28L27 24H23L27 32ZM23 24H19L23 28L27 24H23Z"
          fill="#ffffff"
        />
        {/* Simple stylized wrench/gear representation inside the box */}
        <path
          d="M31.293 21.707c-1.414-1.414-3.56-1.583-5.172-.464l-6.828 6.828a3.996 3.996 0 0 0-5.657 5.657l1.414-1.414a2 2 0 1 1 2.829-2.829l-1.414 1.414a4.004 4.004 0 0 0 5.657-5.657l6.828-6.828c1.119 1.612 3.265 1.782 4.679.368 1.562-1.562 1.562-4.095 0-5.657s-4.095-1.562-5.657 0z"
          fill="#ffffff"
        />
      </Box>

      {/* ── Text (hidden if variant is 'icon') ── */}
      {variant === 'full' && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography
            sx={{
              fontSize: '16px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: textColor,
              whiteSpace: 'nowrap',
              fontFamily: '"Inter", sans-serif',
            }}
          >
            TechFlow Repair
          </Typography>
          <Typography
            sx={{
              fontSize: '11px',
              fontWeight: 500,
              color: secondaryColor,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
            }}
          >
            Terminal A-12
          </Typography>
        </Box>
      )}
    </Box>
  );
}
