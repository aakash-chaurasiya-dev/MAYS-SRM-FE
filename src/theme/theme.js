import { createTheme } from '@mui/material/styles';

/**
 * ─────────────────────────────────────────────────────────────────
 *  MAYS Computer Repair — Design System Theme
 * ─────────────────────────────────────────────────────────────────
 *
 *  Based on the DESIGN.md specification:
 *  - Corporate / Modern aesthetic (pro-tools feel)
 *  - Trust Blue primary (#003d9b / #0052cc)
 *  - Semantic status colors: Green (success), Amber (warning), Red (danger)
 *  - Inter typeface, tight scale for high-density data views
 *  - Tonal layers over heavy shadows for depth
 *  - Soft 0.25rem (4px) rounding
 * ─────────────────────────────────────────────────────────────────
 */

/* ── Design tokens from DESIGN.md ── */
const tokens = {
  colors: {
    primary:              '#003d9b',
    primaryContainer:     '#0052cc',
    onPrimary:            '#ffffff',
    onPrimaryContainer:   '#c4d2ff',
    inversePrimary:       '#b2c5ff',

    secondary:            '#006c47',
    secondaryContainer:   '#82f9be',
    onSecondary:          '#ffffff',
    onSecondaryContainer: '#00734c',

    tertiary:             '#7b2600',
    tertiaryContainer:    '#a33500',
    onTertiary:           '#ffffff',
    onTertiaryContainer:  '#ffc6b2',

    error:                '#ba1a1a',
    errorContainer:       '#ffdad6',
    onError:              '#ffffff',
    onErrorContainer:     '#93000a',

    surface:              '#faf8ff',
    surfaceDim:           '#d9d9e4',
    surfaceBright:        '#faf8ff',
    surfaceContainerLowest:  '#ffffff',
    surfaceContainerLow:     '#f3f3fd',
    surfaceContainerMid:     '#ededf8',
    surfaceContainerHigh:    '#e7e7f2',
    surfaceContainerHighest: '#e1e2ec',
    surfaceVariant:          '#e1e2ec',

    onSurface:            '#191b23',
    onSurfaceVariant:     '#434654',
    inverseSurface:       '#2e3038',
    inverseOnSurface:     '#f0f0fb',

    outline:              '#737685',
    outlineVariant:       '#c3c6d6',
    surfaceTint:          '#0c56d0',

    background:           '#faf8ff',
    onBackground:         '#191b23',
  },

  /* Elevation tonal layers from DESIGN.md */
  elevation: {
    level0: '#F4F5F7',          // backdrop
    level1Border: '#DFE1E6',    // card / sidebar border
    level2Shadow: '0px 4px 8px rgba(9, 30, 66, 0.08)', // floating
  },

  rounded: {
    sm:      '0.125rem',  // 2px
    DEFAULT: '0.25rem',   // 4px — standard
    md:      '0.375rem',  // 6px
    lg:      '0.5rem',    // 8px
    xl:      '0.75rem',   // 12px
    full:    '9999px',
  },

  spacing: {
    unit: 4,
    containerPadding: 24,
    gutter: 16,
    sidebarWidth: 240,
    tabHeight: 40,
  },
};

export const getAppTheme = (mode) => {
  const isDark = mode === 'dark';
  return createTheme({
  palette: {
    mode,
    primary: {
      main:         tokens.colors.primary,
      light:        tokens.colors.primaryContainer,
      dark:         '#002b6e',
      contrastText: tokens.colors.onPrimary,
    },
    secondary: {
      main:         tokens.colors.secondary,
      light:        '#009963',
      dark:         '#004d33',
      contrastText: tokens.colors.onSecondary,
    },
    error: {
      main:         tokens.colors.error,
      light:        tokens.colors.errorContainer,
      dark:         tokens.colors.onErrorContainer,
      contrastText: tokens.colors.onError,
    },
    warning: {
      main:   '#B95000',
      light:  '#FFDBCF',
      dark:   '#7b2600',
    },
    success: {
      main:   tokens.colors.secondary,
      light:  tokens.colors.secondaryContainer,
      dark:   '#004d33',
    },
    info: {
      main:   tokens.colors.surfaceTint,
      light:  '#dae2ff',
      dark:   '#001848',
    },
    background: {
      default: isDark ? '#121212' : tokens.elevation.level0,
      paper:   isDark ? '#1e1e1e' : tokens.colors.surfaceContainerLowest,
    },
    text: {
      primary:   isDark ? '#ffffff' : tokens.colors.onSurface,
      secondary: isDark ? 'rgba(255, 255, 255, 0.7)' : tokens.colors.onSurfaceVariant,
    },
    divider: isDark ? 'rgba(255, 255, 255, 0.12)' : tokens.elevation.level1Border,
    action: {
      hover: 'rgba(0, 61, 155, 0.06)',
      selected: 'rgba(0, 61, 155, 0.10)',
    },
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize:      '24px',
      fontWeight:     600,
      lineHeight:    '32px',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize:      '20px',
      fontWeight:     600,
      lineHeight:    '28px',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight:     600,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight:     600,
      lineHeight:    '28px',
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight:     600,
    },
    subtitle1: {
      fontWeight: 500,
      color: tokens.colors.onSurfaceVariant,
    },
    body1: {
      fontSize:   '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    body2: {
      fontSize:   '14px',
      fontWeight: 400,
      lineHeight: '20px',
      color: tokens.colors.onSurfaceVariant,
    },
    caption: {
      fontSize:      '12px',
      fontWeight:     700,
      lineHeight:    '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 4, // 0.25rem DEFAULT from spec
  },

  shadows: [
    'none',
    'none', // elevation 1 is flat in this theme
    `0 1px 3px 0 rgba(9, 30, 66, 0.06), 0 1px 2px -1px rgba(9, 30, 66, 0.06)`,
    `${tokens.elevation.level2Shadow}`,
    '0 10px 15px -3px rgba(9, 30, 66, 0.08), 0 4px 6px -4px rgba(9, 30, 66, 0.06)',
    '0 20px 25px -5px rgba(9, 30, 66, 0.08), 0 8px 10px -6px rgba(9, 30, 66, 0.06)',
    ...Array(19).fill('0 25px 50px -12px rgba(9, 30, 66, 0.12)'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: isDark ? '#121212' : tokens.elevation.level0,
          color: isDark ? '#ffffff' : tokens.colors.onSurface,
        },
      },
    },

    /* ── Buttons (from DESIGN.md: Primary solid, Secondary outlined, Ghost text) ── */
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,  // 3px per spec
          padding: '8px 20px',
          fontSize: '0.875rem',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundColor: tokens.colors.primary,
          color: tokens.colors.onPrimary,
          boxShadow: 'none', // Flat pro look
          '&:hover': {
            backgroundColor: tokens.colors.primaryContainer,
            boxShadow: 'none',
          },
        },
        outlinedPrimary: {
          borderColor: tokens.colors.primary,
          color: tokens.colors.primary,
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: 'rgba(0, 61, 155, 0.06)',
          },
        },
        textPrimary: {
          color: tokens.colors.primary,
          '&:hover': {
            backgroundColor: 'rgba(0, 61, 155, 0.06)',
          },
        },
      },
    },

    /* ── Paper (tonal layers, 1px border) ── */
    MuiPaper: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${tokens.elevation.level1Border}`,
        },
        outlined: {
          border: `1px solid ${tokens.elevation.level1Border}`,
          boxShadow: 'none',
        },
        elevation1: {
          boxShadow: 'none',
          border: `1px solid ${tokens.elevation.level1Border}`,
        },
      },
    },

    /* ── Chips (2px radius for technical tag look) ── */
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 2, // 2px per spec
          letterSpacing: '0.02em',
        },
      },
    },

    /* ── Text Fields (2px border, blue halo on focus) ── */
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            '& fieldset': {
              borderColor: tokens.elevation.level1Border,
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: tokens.colors.outline,
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.colors.primary,
              boxShadow: `0 0 0 2px rgba(0, 61, 155, 0.20)`,
            },
          },
        },
      },
    },

    /* ── Tabs (match chrome-tab spec: rounded top corners, 4px) ── */
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: '4px 4px 0 0',
          textTransform: 'none',
          fontWeight: 500,
          minHeight: tokens.spacing.tabHeight,
          '&.Mui-selected': {
            fontWeight: 700,
            color: tokens.colors.primary,
          },
        },
      },
    },

    /* ── Tooltip ── */
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 3,
          fontSize: '0.75rem',
          backgroundColor: tokens.colors.inverseSurface,
          color: tokens.colors.inverseOnSurface,
        },
      },
    },

    /* ── Avatar ── */
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.8rem',
          fontWeight: 700,
        },
      },
    },
  },
});
};

/* Export tokens for direct consumption where needed */
export { tokens };
export default getAppTheme('light');
