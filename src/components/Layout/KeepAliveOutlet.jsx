import { useRef, useState, useEffect } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTabNavigation } from '../../contexts/TabNavigationContext';

/**
 * Keeps previously visited tab routes mounted (hidden) so form state persists
 * when switching between open tabs.
 */
export default function KeepAliveOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const { tabs } = useTabNavigation();
  const cacheRef = useRef(new Map());
  const [cache, setCache] = useState(new Map());

  const activeKey = location.pathname + location.search;

  // Cache outlet on first visit only — do not replace on return (preserves state)
  useEffect(() => {
    if (outlet && !cacheRef.current.has(activeKey)) {
      cacheRef.current.set(activeKey, outlet);
      setCache(new Map(cacheRef.current));
    }
  }, [activeKey, outlet]);

  // Remove cached pages when their tab is closed
  useEffect(() => {
    const openTabIds = new Set(tabs.map((tab) => tab.id));
    openTabIds.add(activeKey);

    let changed = false;
    for (const key of cacheRef.current.keys()) {
      if (!openTabIds.has(key)) {
        cacheRef.current.delete(key);
        changed = true;
      }
    }
    if (changed) {
      setCache(new Map(cacheRef.current));
    }
  }, [tabs, activeKey]);

  if (cache.size === 0 && outlet) {
    return outlet;
  }

  return (
    <>
      {Array.from(cache.entries()).map(([key, element]) => (
        <Box
          key={key}
          sx={{ display: key === activeKey ? 'block' : 'none' }}
        >
          {element}
        </Box>
      ))}
    </>
  );
}
