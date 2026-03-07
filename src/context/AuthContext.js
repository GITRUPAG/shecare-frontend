import { createContext, useContext, useState, useEffect } from "react";
import { login as loginAPI } from "../api/authService";
import { saveToken, getToken, removeToken } from "../utils/tokenStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) setUser({ token });
    setLoading(false);
  }, []);

  const login = async (credentials, remember = false) => {
    const response = await loginAPI(credentials);
    saveToken(response.token, remember);
    setUser({ name: response.name, role: response.role, token: response.token });
    return response;
  };

  // ✅ Used by Google login — token already obtained from backend, just save it
  const saveTokenDirectly = (token, remember = false) => {
    saveToken(token, remember);
    setUser({ token });
  };

  const logout = () => {
    removeToken();
    localStorage.removeItem("shecare_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      saveTokenDirectly,
      loading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);