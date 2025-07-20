import { useState, useEffect } from 'react';

export function useDefaultModel() {
  const [defaultModel, setDefaultModel] = useState('ADS800A');

  useEffect(() => {
    const savedModel = localStorage.getItem('defaultModel');
    if (savedModel) {
      setDefaultModel(savedModel);
    }
  }, []);

  const updateDefaultModel = (value: string) => {
    setDefaultModel(value);
    localStorage.setItem('defaultModel', value);
  };

  return { defaultModel, updateDefaultModel };
} 