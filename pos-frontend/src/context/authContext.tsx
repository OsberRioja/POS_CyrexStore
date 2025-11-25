import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService"; // Importamos solo el valor
import type { LoginResponse } from "../services/authService"; // Importamos el tipo por separado

// Exportar el tipo User para que pueda ser importado desde otros archivos
export interface User {
  id: string;
  userCode: number;
  name: string;
  email: string;
  phone?: string;
  role: "ADMIN" | "SUPERVISOR" | "SELLER";
  createdAt: string;
}

interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar la app
  useEffect(() => {
    const savedToken = authService.getToken();
    const savedUser = authService.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (login: string, password: string) => {
    try {
      const response = await authService.login({ login, password });
      const { token: newToken, user: newUser } = response.data;

      // Guardar en localStorage
      authService.saveToken(newToken);
      authService.saveUser(newUser);

      // Actualizar estado
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw error; // Propagar error para manejo en componentes
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}