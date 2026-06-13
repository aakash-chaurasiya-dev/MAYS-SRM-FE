import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import darkLogo from '../../assets/dark_logo.svg';
import lightLogo from '../../assets/light_logo.svg';

export default function Logo({ mode = 'auto', width = 256, height = 256 }) {
  const theme = useTheme();

  const isDark = mode === 'auto' ? theme.palette.mode === 'dark' : mode === 'dark';
  const logoSrc = isDark ? darkLogo : lightLogo;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
      {/* ── Icon ── */}
      <Box
        component="img"
        src={logoSrc}
        alt="Mays Computer logo"
        sx={{ width, height, minWidth: width }}
      />
    </Box>
  );
}
