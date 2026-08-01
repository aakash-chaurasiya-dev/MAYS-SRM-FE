import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeContextProvider } from './theme/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import favicon from './assets/light_logo.svg';
import './index.css';
import App from './App.jsx';

const setFavicon = (href) => {
  const links = document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']");
  links.forEach((link) => {
    link.href = href;
  });
};

setFavicon(favicon);

// Configure a global QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, // 60 minutes (cache lookups)
      refetchOnWindowFocus: false, // Don't aggressively refetch on tab switch
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeContextProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
