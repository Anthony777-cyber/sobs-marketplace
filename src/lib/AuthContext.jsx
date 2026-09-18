import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({ full_name: "Guest", email: "", role: "user" });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: "sobs-app", public_settings: {} });

  const logout = () => {
    window.location.href = "/";
  };

  const navigateToLogin = () => {
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ 
       user, 
       isAuthenticated, 
       isLoadingAuth,
       isLoadingPublicSettings,
       authError,
       appPublicSettings,
       authChecked,
       logout,
       navigateToLogin,
       checkUserAuth: async () => {},
       checkAppState: async () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
