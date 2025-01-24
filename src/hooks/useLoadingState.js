import { useState, useCallback } from 'react';

export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  
  const startLoading = useCallback(() => {
    setError(null);
    setIsLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  const setLoadingError = useCallback((err) => {
    setError(err);
    setIsLoading(false);
  }, []);

  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);
  
  return { 
    isLoading, 
    error, 
    startLoading, 
    stopLoading, 
    setLoadingError,
    resetState
  };
}; 