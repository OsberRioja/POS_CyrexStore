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
  branchId?: number | null;
}

interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;
  currentBranchId?: number | null;
  isInBranchMode: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  completePasswordChange: () => void;
  selectBranch: (branchId: number | null) => void;
  enterBranch: (branchId: number) => void;
  exitToAdminHome: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState<boolean>(false);
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
  const [isInBranchMode, setIsInBranchMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar la app
  useEffect(() => {
    const savedToken = authService.getToken();
    const savedUser = authService.getUser();
    const savedBranchId = authService.getSelectedBranch();
    const savedBranchMode = authService.getBranchMode();


    if (savedToken && savedUser) {
      setToken(savedToken);
      const userWithDefaults = {
        ...savedUser,
        passwordChangeRequired: savedUser.passwordChangeRequired ?? false,
        branchId: savedUser.branchId ?? null,
      };
      setUser(userWithDefaults);
      authService.saveUser(userWithDefaults);

      const branchToUse = savedBranchId || savedUser.branchId || null;

      // Si es admin global y no hay sucursal seleccionada, forzar selección
      if (userWithDefaults.role === 'ADMIN' && userWithDefaults.branchId === null && !savedBranchId) {
        console.log('⚠️ Admin global sin sucursal seleccionada - se requiere seleccionar una');
        // Podrías redirigir a una página de selección de sucursal aquí
        // Por ahora, lo dejamos como null pero mostramos un mensaje
      }

      setCurrentBranchId(branchToUse);
      setIsInBranchMode(savedBranchMode || (branchToUse !== null && userWithDefaults.role !== 'ADMIN'));

      // Nota: No podemos saber si requiere cambio de contraseña desde localStorage
      // Esto se manejara en el primer login despues de cargar la página
    }
    setLoading(false);
  }, []);

  // Función para ingresar a una sucursal
  const enterBranch = (branchId: number) => {
    authService.saveSelectedBranch(branchId);
    setCurrentBranchId(branchId);
    setIsInBranchMode(true);
    authService.saveBranchMode(true);
    console.log(`🏪 Ingresando a sucursal: ${branchId}`);
  };

  // Función para volver al home admin
  const exitToAdminHome = () => {
    authService.saveSelectedBranch(null);
    setCurrentBranchId(null);
    setIsInBranchMode(false);
    authService.saveBranchMode(false);
    console.log('🏠 Volviendo al home admin');
  };

  const login = async (login: string, password: string) => {
    try {
      const response = await authService.login({ login, password });
      const { token: newToken, user: newUser, requiresPasswordChange } = response.data;

      // Guardar en localStorage
      authService.saveToken(newToken);
      authService.saveUser(newUser);

      // Para usuarios no admin, establecer su sucursal como la actual
      if (newUser.role !== "ADMIN" && newUser.branchId) {
        authService.saveSelectedBranch(newUser.branchId);
      }

      // Actualizar estado
      setToken(newToken);
      setUser(newUser);
      setRequiresPasswordChange(requiresPasswordChange);

      // Establecer sucursal actual
      const branchId = newUser.branchId || null;
      setCurrentBranchId(branchId);
    } catch (error) {
      throw error; // Propagar error para manejo en componentes
    }
  };

  const logout = () => {
    authService.clearAuthState();
    setToken(null);
    setUser(null);
    setRequiresPasswordChange(false);
    setCurrentBranchId(null);
    setIsInBranchMode(false);
  };

  const completePasswordChange = () => {
    setRequiresPasswordChange(false);
  };

  // Funcion para cambiar de sucursal (para administradores)
  const selectBranch = (branchId: number | null) => {
    if (user?.role !== 'ADMIN') {
      console.warn("Solo los administradores pueden cambiar de sucursal.");
      return;
    }
    authService.saveSelectedBranch(branchId);
    setCurrentBranchId(branchId);

    if (isInBranchMode && branchId) {
      console.log(`🏪 Cambiando a sucursal: ${branchId}`);
    }
  };


  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    requiresPasswordChange,
    currentBranchId,
    isInBranchMode,
    login,
    logout,
    loading,
    completePasswordChange,
    selectBranch,
    enterBranch,
    exitToAdminHome
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