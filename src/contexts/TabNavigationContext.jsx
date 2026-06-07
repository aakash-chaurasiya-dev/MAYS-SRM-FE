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
      console.log('routeInfo',routeInfo);
      console.log('match',match);
      console.log('pathname',pathname);
      
      const title = typeof routeInfo.title === 'function' ? routeInfo.title(match.params) : pathname;
      console.log('title',title);

      return { ...routeInfo, title, params: match.params };
    }
  }
  return null;
};

export function TabNavigationProvider({ children }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load from localStorage on initial mount
  useEffect(() => {
    console.log('chnage 2');
    try {
      const savedTabs = localStorage.getItem('openTabs');
      const savedActiveTab = localStorage.getItem('activeTabId');
      const initialTabs = savedTabs ? JSON.parse(savedTabs) : [];
      
      setTabs(initialTabs);
      console.log('Tabs - ve',tabs);
      if (savedActiveTab) {
        setActiveTabId(JSON.parse(savedActiveTab));
      }
    } catch (error) {
      console.error("Failed to parse tabs from localStorage", error);
      setTabs([]); // Reset to safe state
    }
  }, []);

  // Save to localStorage whenever tabs or active tab changes
  useEffect(() => {
      localStorage.setItem('openTabs', JSON.stringify(tabs));
      localStorage.setItem('activeTabId', JSON.stringify(activeTabId));   
  }, [tabs, activeTabId]);

  // Sync with router to add/activate tabs on navigation
  useEffect(() => {
   
    const { pathname } = location;
    const routeInfo = findRouteInfo(pathname);
    console.log('route ',routeInfo);
    if (routeInfo) {
      const isTabOpen = tabs.some((tab) => tab.path === pathname);
      console.log('it canme here',isTabOpen);
      if (!isTabOpen) {
        const newTab = {
          id: pathname,
          path: pathname,
          title: routeInfo.title,
          icon: routeInfo.icon,
          isClosable: routeInfo.isClosable !== false,
        };
        setTabs((prevTabs) => [...prevTabs, newTab]);
      }
      setActiveTabId(pathname);
    }
  }, [location.pathname, tabs]);

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