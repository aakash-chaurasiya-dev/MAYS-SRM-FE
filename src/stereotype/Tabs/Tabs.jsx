import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/material/styles';

/**
 * ─────────────────────────────────────────────────────────────────
 *  Tabs  –  Chrome-style tab bar with fixed & removable tabs
 * ─────────────────────────────────────────────────────────────────
 *
 *  Usage:
 *    <Tabs
 *      tabs={tabs}
 *      activeTab={activeTab}
 *      onTabChange={(tabId) => void}
 *      onTabClose={(tabId) => void}
 *      onTabAdd={() => void}
 *      showAddButton={true}
 *      addTooltip="New tab"
 *    />
 *
 *  Tab shape:
 *  {
 *    id:        string | number      — unique identifier
 *    label:     string               — tab display text
 *    icon:      ReactNode            — optional icon rendered before label
 *    removable: boolean              — if true, shows close button (chrome-style)
 *    disabled:  boolean              — if true, tab is non-interactive
 *  }
 * ─────────────────────────────────────────────────────────────────
 */

export default function Tabs({
  tabs = [],
  activeTab,
  onTabChange,
  onTabClose,
  onTabAdd,
  showAddButton = false,
  addTooltip = 'New tab',
}) {
  const theme = useTheme();
  const tabsRef = useRef({});
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  /* ── Slide the active indicator ── */
  const updateIndicator = useCallback(() => {
    const activeEl = tabsRef.current[activeTab];
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator, tabs]);

  /* ── Styles ── */
  const sx = {
    container: {
      position: 'relative',
      display: 'flex',
      alignItems: 'stretch',
      bgcolor: theme.palette.background.default,
      borderBottom: `1.5px solid ${theme.palette.divider}`,
      px: 1,
      minHeight: 46,
      overflow: 'hidden',
    },
    tabsScroll: {
      display: 'flex',
      alignItems: 'stretch',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': { display: 'none' },
      flex: 1,
    },
    tab: (isActive, isDisabled) => ({
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: 0.8,
      px: 2,
      py: 1,
      cursor: isDisabled ? 'default' : 'pointer',
      opacity: isDisabled ? 0.45 : 1,
      userSelect: 'none',
      whiteSpace: 'nowrap',
      borderRadius: '4px 4px 0 0',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      bgcolor: isActive ? theme.palette.background.paper : 'transparent',
      boxShadow: isActive
        ? `0 -1px 4px rgba(0,0,0,0.06)`
        : 'none',
      zIndex: isActive ? 2 : 1,
      '&:hover': !isDisabled
        ? {
            bgcolor: isActive
              ? theme.palette.background.paper
              : `${theme.palette.primary.main}08`,
          }
        : {},
    }),
    label: (isActive) => ({
      fontSize: '0.82rem',
      fontWeight: isActive ? 700 : 500,
      letterSpacing: '0.01em',
      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
      transition: 'color 0.2s ease, font-weight 0.2s ease',
      maxWidth: 160,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    closeBtn: (isActive) => ({
      ml: 0.3,
      p: '2px',
      borderRadius: '4px',
      color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
      opacity: 0.6,
      transition: 'all 0.15s ease',
      '&:hover': {
        opacity: 1,
        bgcolor: `${theme.palette.error.main}14`,
        color: theme.palette.error.main,
      },
    }),
    indicator: {
      position: 'absolute',
      bottom: 0,
      height: '2.5px',
      borderRadius: '2px 2px 0 0',
      background: theme.palette.primary.main,
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    addBtn: {
      alignSelf: 'center',
      ml: 0.5,
      p: '5px',
      borderRadius: '6px',
      color: theme.palette.text.secondary,
      transition: 'all 0.15s ease',
      '&:hover': {
        bgcolor: `${theme.palette.primary.main}12`,
        color: theme.palette.primary.main,
      },
    },
  };

  const handleTabClick = (tab) => {
    if (tab.disabled) return;
    onTabChange?.(tab.id);
  };

  const handleClose = (e, tab) => {
    e.stopPropagation();
    onTabClose?.(tab.id);
  };

  return (
    <Box ref={containerRef} sx={sx.container}>
      <Box sx={sx.tabsScroll}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Box
              key={tab.id}
              ref={(el) => (tabsRef.current[tab.id] = el)}
              sx={sx.tab(isActive, tab.disabled)}
              onClick={() => handleTabClick(tab)}
              role="tab"
              aria-selected={isActive}
              aria-disabled={tab.disabled}
            >
              {tab.icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    fontSize: 18,
                    transition: 'color 0.2s ease',
                    '& > svg': { fontSize: 18 },
                  }}
                >
                  {tab.icon}
                </Box>
              )}

              <Typography noWrap sx={sx.label(isActive)}>
                {tab.label}
              </Typography>

              {tab.removable && (
                <IconButton
                  size="small"
                  sx={sx.closeBtn(isActive)}
                  onClick={(e) => handleClose(e, tab)}
                  aria-label={`Close ${tab.label}`}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Box>

      {showAddButton && (
        <Tooltip title={addTooltip} arrow>
          <IconButton size="small" sx={sx.addBtn} onClick={onTabAdd}>
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Sliding gradient indicator */}
      <Box
        sx={{
          ...sx.indicator,
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
    </Box>
  );
}
