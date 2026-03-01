import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from "react";
import { authService } from "../services/authService";

const initialState = {
  user: null,
  loading: true,
  error: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, loading: false, error: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOGOUT":
      return { ...initialState, loading: false };
    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On mount: restore session from httpOnly cookie
  useEffect(() => {
    authService
      .getMe()
      .then((res) => dispatch({ type: "SET_USER", payload: res.data }))
      .catch(() => dispatch({ type: "LOGOUT" }));
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await authService.login(credentials);
      dispatch({ type: "SET_USER", payload: res.data.user });
      return res;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      throw err;
    }
  }, []);

  const register = useCallback(async (data) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await authService.register(data);
      dispatch({ type: "SET_LOADING", payload: false });
      return res;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (_) {}
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const setUser = useCallback((userData) => {
    dispatch({ type: "SET_USER", payload: userData });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, clearError, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
