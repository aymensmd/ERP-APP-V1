import React, { createContext, useState, useEffect, useContext } from "react";

const StateContext = createContext({
  user: null,
  token: null,
  setUser: () => {},
  setToken: () => {},
  logout: () => {}, // Add logout function to context
  theme: 'light',
  setTheme: () => {}
});

export const ContextProvider = ({ children }) => {
  const [user, _setUser] = useState(() => {
    const storedUser = localStorage.getItem("USER");
    return storedUser ? JSON.parse(storedUser) : null;
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
      localStorage.setItem("USER", JSON.stringify(user));
      // Also set USER_DATA if it's part of your user object
      if (user.data) {
        localStorage.setItem("USER_DATA", JSON.stringify(user.data));
      }
    } else {
      localStorage.removeItem("USER");
      localStorage.removeItem("USER_DATA");
    }
    _setUser(user);
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