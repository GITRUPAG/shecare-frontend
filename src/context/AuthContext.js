import { createContext, useContext, useState, useEffect } from "react";
import { login as loginAPI } from "../api/authService";
import { saveToken, getToken, removeToken } from "../utils/tokenStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user session on app start
  useEffect(() => {

    const token = getToken();

    if (token) {
      setUser({ token });
    }

    setLoading(false);

  }, []);

  // Login function
  const login = async (credentials) => {

    const response = await loginAPI(credentials);

    saveToken(response.token);

    setUser({
      name: response.name,
      role: response.role,
      token: response.token
    });

    return response;
  };

  // Logout
  const logout = () => {

    removeToken();
    setUser(null);

  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);