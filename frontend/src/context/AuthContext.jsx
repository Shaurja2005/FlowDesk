import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_LOGOUT':
      return { user: null, accessToken: null, isAuthenticated: false, isLoading: false };
    case 'AUTH_ERROR':
      return { ...state, isLoading: false, isAuthenticated: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'AUTH_ERROR' });
      return;
    }
    authApi
      .getMe()
      .then(({ data }) => {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: data.data, accessToken: token },
        });
      })
      .catch((err) => {
        localStorage.removeItem('accessToken');
        dispatch({ type: 'AUTH_ERROR' });
        if (err.response?.data?.code === 'ACCOUNT_SUSPENDED') {
          // You could also toast or set a specific state here if needed globally
        }
      });
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await authApi.login(credentials);
      localStorage.setItem('accessToken', data.data.accessToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: data.data });
      return data.data;
    } catch (error) {
      if (error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
        localStorage.removeItem('accessToken');
        dispatch({ type: 'AUTH_LOGOUT' });
      }
      throw error;
    }
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await authApi.register(userData);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (token) => {
    const { data } = await authApi.googleLogin(token);
    localStorage.setItem('accessToken', data.data.accessToken);
    dispatch({ type: 'AUTH_SUCCESS', payload: data.data });
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    localStorage.removeItem('accessToken');
    dispatch({ type: 'AUTH_LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
