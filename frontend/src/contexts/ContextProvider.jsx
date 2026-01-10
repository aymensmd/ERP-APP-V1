import React, { createContext, useState, useEffect, useContext } from "react";

const StateContext = createContext({
  user: null,
  token: null,
  setUser: () => {},
  setToken: () => {},
  logout: () => {}, // Add logout function to context
  theme: 'light',
  setTheme: () => {},
  refreshPermissions: () => {}, // Refresh user permissions
});

export const ContextProvider = ({ children }) => {
  const [user, _setUser] = useState(() => {
    const storedUser = localStorage.getItem("USER");
    if (!storedUser) return null;
    
    try {
      const parsedUser = JSON.parse(storedUser);
      // Ensure permissions is always an array
      if (parsedUser && parsedUser.permissions && !Array.isArray(parsedUser.permissions)) {
        if (typeof parsedUser.permissions === 'string') {
          try {
            parsedUser.permissions = JSON.parse(parsedUser.permissions);
          } catch (e) {
            parsedUser.permissions = [];
          }
        } else if (typeof parsedUser.permissions === 'object') {
          parsedUser.permissions = Object.values(parsedUser.permissions);
        } else {
          parsedUser.permissions = [];
        }
        // Save the normalized user back to localStorage
        localStorage.setItem("USER", JSON.stringify(parsedUser));
      } else if (parsedUser && !parsedUser.permissions) {
        parsedUser.permissions = [];
      }
      return parsedUser;
    } catch (e) {
      console.error('Error parsing stored user:', e);
      return null;
    }
  });
  
  const [token, _setToken] = useState(() => localStorage.getItem('ACCESS_TOKEN'));

  const [theme, _setTheme] = useState(() => {
    return localStorage.getItem('APP_THEME') || 'light';
  });

  const setToken = (token) => {
    if (token) {
      localStorage.setItem("ACCESS_TOKEN", token);
    } else {
      localStorage.removeItem("ACCESS_TOKEN");
    }
    _setToken(token);
  };

  const setUser = (user) => {
    if (user) {
      // Normalize permissions to ensure it's always an array
      const normalizedUser = { ...user };
      if (!normalizedUser.permissions) {
        normalizedUser.permissions = [];
      } else if (!Array.isArray(normalizedUser.permissions)) {
        if (typeof normalizedUser.permissions === 'string') {
          try {
            normalizedUser.permissions = JSON.parse(normalizedUser.permissions);
          } catch (e) {
            normalizedUser.permissions = [];
          }
        } else if (typeof normalizedUser.permissions === 'object') {
          normalizedUser.permissions = Object.values(normalizedUser.permissions);
        } else {
          normalizedUser.permissions = [];
        }
      }
      
      localStorage.setItem("USER", JSON.stringify(normalizedUser));
      // Also set USER_DATA if it's part of your user object
      if (normalizedUser.data) {
        localStorage.setItem("USER_DATA", JSON.stringify(normalizedUser.data));
      }
      _setUser(normalizedUser);
    } else {
      localStorage.removeItem("USER");
      localStorage.removeItem("USER_DATA");
      _setUser(null);
    }
  };

  const setTheme = (theme) => {
    _setTheme(theme);
    localStorage.setItem('APP_THEME', theme);
  };

  // Add this centralized logout function
  const logout = () => {
    _setToken(null);
    _setUser(null);
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("USER");
    localStorage.removeItem("USER_DATA");
    localStorage.removeItem("USER_ID");
    // Add any other auth-related items you need to clear
  };

  return (
    <StateContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        logout, // Make it available in context
        theme,
        setTheme
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);