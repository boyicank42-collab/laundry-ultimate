import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
}

interface OutletContextType {
  outlets: Outlet[];
  currentOutlet: Outlet | null;
  setCurrentOutlet: (outlet: Outlet | null) => void;
  loading: boolean;
  refreshOutlets: () => Promise<void>;
}

const OutletContext = createContext<OutletContextType | undefined>(undefined);

export const OutletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [currentOutlet, setCurrentOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOutlets = async () => {
    try {
      const response = await api.get('/outlets');
      setOutlets(response.data);
      if (response.data.length > 0 && !currentOutlet) {
        setCurrentOutlet(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  return (
    <OutletContext.Provider value={{ 
      outlets, 
      currentOutlet, 
      setCurrentOutlet, 
      loading, 
      refreshOutlets: fetchOutlets 
    }}>
      {children}
    </OutletContext.Provider>
  );
};

export const useOutlet = () => {
  const context = useContext(OutletContext);
  if (!context) {
    throw new Error('useOutlet must be used within OutletProvider');
  }
  return context;
};