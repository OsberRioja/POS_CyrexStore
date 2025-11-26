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
  passwordChangeRequired?: boolean;
}

interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  completePasswordChange: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar la app
  useEffect(() => {
    const savedToken = authService.getToken();
    const savedUser = authService.getUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      const userWithDefaults = {
        ...savedUser,
        passwordChangeRequired: savedUser.passwordChangeRequired ?? false
      };
      setUser(userWithDefaults);
      authService.saveUser(userWithDefaults);

      // Nota: No podemos saber si requiere cambio de contraseña desde localStorage
      // Esto se manejara en el primer login despues de cargar la página
    }
    setLoading(false);
  }, []);

  const login = async (login: string, password: string) => {
    try {
      const response = await authService.login({ login, password });
      const { token: newToken, user: newUser, requiresPasswordChange } = response.data;
      console.log('🔐 Login response COMPLETA:', response.data);
      console.log('🔐 Campos del usuario:', newUser ? Object.keys(newUser) : 'No user');
      console.log('🔐 requiresPasswordChange:', requiresPasswordChange);

      // Guardar en localStorage
      authService.saveToken(newToken);
      authService.saveUser(newUser);

      // Actualizar estado
      setToken(newToken);
      setUser(newUser);
      setRequiresPasswordChange(requiresPasswordChange);
    } catch (error) {
      throw error; // Propagar error para manejo en componentes
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setRequiresPasswordChange(false);
  };

  const completePasswordChange = () => {
    setRequiresPasswordChange(false);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    requiresPasswordChange,
    login,
    logout,
    loading,
    completePasswordChange,
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