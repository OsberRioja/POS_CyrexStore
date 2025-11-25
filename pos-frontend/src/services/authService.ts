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
  };
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

  // Logout - limpiar localStorage
  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Verificar si está logueado
  isAuthenticated: (): boolean => {
    const token = authService.getToken();
    return !!token;
  }
};

// Interceptor para agregar token automáticamente a las requests
axios.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);