import React, { createContext, useState, useEffect, useContext } from "react";
import { storage, STORAGE_KEYS } from '../utils/storage';

const StateContext = createContext({
  user: null,
  token: null,
  setUser: () => { },
  setToken: () => { },
  logout: () => { }, // Add logout function to context
  theme: 'light',
  setTheme: () => { },
  refreshPermissions: () => { }, // Refresh user permissions
});

export const ContextProvider = ({ children }) => {
  const [user, _setUser] = useState(() => {
    const parsedUser = storage.get(STORAGE_KEYS.USER);
    if (!parsedUser) return null;

    // Ensure permissions is always an array (normalization)
    if (parsedUser) {
      if (!parsedUser.permissions) {
        parsedUser.permissions = [];
      } else if (!Array.isArray(parsedUser.permissions)) {
        // Handle edge cases where permissions might be string or object
        if (typeof parsedUser.permissions === 'string') {
          try {
            // Try parsing if it's a JSON string
            parsedUser.permissions = JSON.parse(parsedUser.permissions);
            if (!Array.isArray(parsedUser.permissions)) parsedUser.permissions = [];
          } catch (e) {
            parsedUser.permissions = [];
          }
        } else if (typeof parsedUser.permissions === 'object') {
          parsedUser.permissions = Object.values(parsedUser.permissions);
        } else {
          parsedUser.permissions = [];
        }
        // Update storage with normalized data
        storage.set(STORAGE_KEYS.USER, parsedUser);
      }
    }
    return parsedUser;
  });

  const [token, _setToken] = useState(() => storage.get(STORAGE_KEYS.TOKEN));

  const [theme, _setTheme] = useState(() => {
    return storage.get(STORAGE_KEYS.THEME) || 'light';
  });

  const setToken = (token) => {
    if (token) {
      storage.set(STORAGE_KEYS.TOKEN, token);
    } else {
      storage.remove(STORAGE_KEYS.TOKEN);
    }
    _setToken(token);
  };

  const setUser = (user) => {
    if (user) {
      // Normalize permissions
      const normalizedUser = { ...user };

      // Ensure permissions is array
      if (!normalizedUser.permissions) {
        normalizedUser.permissions = [];
      } else if (!Array.isArray(normalizedUser.permissions)) {
        if (typeof normalizedUser.permissions === 'string') {
          try {
            normalizedUser.permissions = JSON.parse(normalizedUser.permissions);
            if (!Array.isArray(normalizedUser.permissions)) normalizedUser.permissions = [];
          } catch (e) {
            normalizedUser.permissions = [];
          }
        } else if (typeof normalizedUser.permissions === 'object') {
          normalizedUser.permissions = Object.values(normalizedUser.permissions);
        } else {
          normalizedUser.permissions = [];
        }
      }

      storage.set(STORAGE_KEYS.USER, normalizedUser);

      if (normalizedUser.data) {
        storage.set(STORAGE_KEYS.USER_DATA, normalizedUser.data);
      }
      _setUser(normalizedUser);
    } else {
      storage.remove(STORAGE_KEYS.USER);
      storage.remove(STORAGE_KEYS.USER_DATA);
      _setUser(null);
    }
  };

  const setTheme = (theme) => {
    _setTheme(theme);
    storage.set(STORAGE_KEYS.THEME, theme);
  };

  // Add this centralized logout function
  const logout = () => {
    _setToken(null);
    _setUser(null);
    storage.clearAuth();
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