import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    userCode: number;
    name: string;
    email: string;
    phone?: string;
    role: "ADMIN" | "SUPERVISOR" | "SELLER";
    createdAt: string;
    passwordChangeRequired?: boolean;
    branchId?: number | null;
  };
  requiresPasswordChange: boolean;
  branch?: {
    id: number;
    name?: string;
  } | null;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export const authService = {
  // Login
  login: (data: LoginRequest) => 
    axios.post<LoginResponse>(`${BASE}/auth/login`, data),

  // Verificar token
  verifyToken: (token: string) => 
    axios.post(`${BASE}/auth/verify-token`, { token }),

  // Obtener token del localStorage
  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  // Guardar token en localStorage
  saveToken: (token: string): void => {
    localStorage.setItem("token", token);
  },

  // Obtener usuario del localStorage
  getUser: (): LoginResponse["user"] | null => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Guardar usuario en localStorage
  saveUser: (user: LoginResponse["user"]): void => {
    localStorage.setItem("user", JSON.stringify(user));
  },

  // Obtener branchId del localStorage
  getBranchId: (): number | null => {
    const user = authService.getUser();
    return user?.branchId ?? null;
  },

  // Guardar informacion de sucursal seleccionada (para administradores)
  saveSelectedBranch: (branchId: number | null): void => {
    if (branchId === null) {
      localStorage.removeItem("selectedBranch");
    } else {
      localStorage.setItem("selectedBranch", branchId.toString());
    }
  },

  // Obtener sucursal seleccionada
  getSelectedBranch: (): number | null => {
    const branchId = localStorage.getItem("selectedBranch");
    return branchId ? parseInt(branchId, 10) : null;
  },

  // Logout - limpiar localStorage
  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedBranch");
  },

  // Verificar si está logueado
  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    return !!token;
  }
};

// // Interceptor para agregar token automáticamente a las requests
// axios.interceptors.request.use(
//   (config) => {
//     const token = authService.getToken();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     const branchId = authService.getSelectedBranch() || authService.getBranchId();
//     if( branchId && config.params ) {
//       config.params.branchId = branchId;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
