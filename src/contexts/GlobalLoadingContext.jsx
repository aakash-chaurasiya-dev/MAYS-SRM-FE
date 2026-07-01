import React, { createContext, useContext, useState } from 'react';

const GlobalLoadingContext = createContext();

export const useGlobalLoading = () => useContext(GlobalLoadingContext);

export const GlobalLoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  const showLoading = (text = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, showLoading, hideLoading, loadingText }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};
