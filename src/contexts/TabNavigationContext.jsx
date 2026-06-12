import {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { ROUTE_CONFIG } from '../services/route-config.jsx';

const TabNavigationContext = createContext();

const findRouteInfo = (pathname) => {
  // First, check for a static match
  if (ROUTE_CONFIG[pathname]) {
    return { ...ROUTE_CONFIG[pathname], params: {} };
  }

  // Then, check for a dynamic match
  for (const routePath in ROUTE_CONFIG) {
    const match = matchPath(routePath, pathname);
    if (match) {
      const routeInfo = ROUTE_CONFIG[routePath];
      const title = typeof routeInfo.title === 'function' ? routeInfo.title(match.params) : pathname;
      return { ...routeInfo, title, params: match.params };
    }
  }
  return null;
};

export function TabNavigationProvider({ children }) {
  const [tabs, setTabs] = useState(() => {
    try {
      const savedTabs = localStorage.getItem('openTabs');
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs);
        // Re-attach icons dynamically since they cannot be serialized
        return parsedTabs.map((tab) => {
          const routeInfo = findRouteInfo(tab.path);
          return {
            ...tab,
            icon: routeInfo ? routeInfo.icon : null,
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Failed to parse tabs from localStorage', error);
      return [];
    }
  });

  const [activeTabId, setActiveTabId] = useState(() => {
    try {
      const savedActiveTab = localStorage.getItem('activeTabId');
      return savedActiveTab ? JSON.parse(savedActiveTab) : null;
    } catch (error) {
      return null;
    }
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Save to localStorage whenever tabs or active tab changes
  useEffect(() => {
    // Strip icons before saving to prevent stringifying React elements
    const tabsToSave = tabs.map(({ icon, ...rest }) => rest);
    localStorage.setItem('openTabs', JSON.stringify(tabsToSave));
    localStorage.setItem('activeTabId', JSON.stringify(activeTabId));
  }, [tabs, activeTabId]);

  // Sync with router to add/activate tabs on navigation
  useEffect(() => {
    const { pathname } = location;
    const routeInfo = findRouteInfo(pathname);
    if (routeInfo) {
      setTabs((prevTabs) => {
        const isTabOpen = prevTabs.some((tab) => tab.path === pathname);
        if (!isTabOpen) {
          const newTab = {
            id: pathname,
            path: pathname,
            title: routeInfo.title,
            icon: routeInfo.icon,
            isClosable: routeInfo.isClosable !== false,
          };
          return [...prevTabs, newTab];
        }
        return prevTabs;
      });
      setActiveTabId(pathname);
    }
  }, [location.pathname]);

  const removeTab = useCallback((tabIdToRemove) => {
    const tabIndex = tabs.findIndex((tab) => tab.id === tabIdToRemove);
    if (tabIndex === -1) return;

    const newTabs = tabs.filter((tab) => tab.id !== tabIdToRemove);
    setTabs(newTabs);

    // If the closed tab was the active one, navigate to a new tab
    if (activeTabId === tabIdToRemove) {
      if (newTabs.length === 0) {
        navigate('/dashboard');
      } else {
        const newActiveIndex = Math.max(0, tabIndex - 1);
        const newActiveTab = newTabs[newActiveIndex];
        if (newActiveTab) {
          navigate(newActiveTab.path);
        }
      }
    }
  }, [tabs, activeTabId, navigate]);

  const value = { tabs, activeTabId, removeTab };

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export const useTabNavigation = () => useContext(TabNavigationContext);