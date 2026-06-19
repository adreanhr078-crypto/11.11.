/**
 * Global Auth State Management for 11.11 Echo Mind System
 * Zustand-based auth state with persistence and game integration
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '../services/authService';

// Define auth state types
export type AuthState = {
  user: any | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  provider: string | null;
  error: string | null;
  actions: {
    loginWithGoogle: () => Promise<void>;
    loginWithFacebook: () => Promise<void>;
    loginAsGuest: () => Promise<void>;
    linkWithGoogle: () => Promise<void>;
    linkWithFacebook: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    initializeAuth: () => void;
  };
};

// Create auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: true,
      provider: null,
      error: null,

      actions: {
        // Initialize auth state
        initializeAuth: () => {
          const unsubscribe = authService.onAuthStateChange((user) => {
            const authState = authService.getAuthState();
            set({
              user: authState.user,
              isAuthenticated: authState.isAuthenticated,
              isGuest: authState.isGuest,
              isLoading: authState.isLoading,
              provider: authState.provider,
              error: null
            });
          });

          // Return unsubscribe function
          return unsubscribe;
        },

        // Login with Google
        loginWithGoogle: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.loginWithGoogle();
          } catch (error) {
            console.error('Google login failed:', error);
            set({
              error: 'Failed to login with Google. Please try again.',
              isLoading: false
            });
            throw error;
          }
        },

        // Login with Facebook
        loginWithFacebook: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.loginWithFacebook();
          } catch (error) {
            console.error('Facebook login failed:', error);
            set({
              error: 'Failed to login with Facebook. Please try again.',
              isLoading: false
            });
            throw error;
          }
        },

        // Login as Guest
        loginAsGuest: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.loginAsGuest();
          } catch (error) {
            console.error('Guest login failed:', error);
            set({
              error: 'Failed to start guest session. Please try again.',
              isLoading: false
            });
            throw error;
          }
        },

        // Link with Google (Guest upgrade)
        linkWithGoogle: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.linkWithGoogle();
          } catch (error) {
            console.error('Google linking failed:', error);
            set({
              error: 'Failed to link with Google. Please try again.',
              isLoading: false
            });
            throw error;
          }
        },

        // Link with Facebook (Guest upgrade)
        linkWithFacebook: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.linkWithFacebook();
          } catch (error) {
            console.error('Facebook linking failed:', error);
            set({
              error: 'Failed to link with Facebook. Please try again.',
              isLoading: false
            });
            throw error;
          }
        },

        // Logout
        logout: async () => {
          try {
            set({ isLoading: true, error: null });
            await authService.logout();
          } catch (error) {
            console.error('Logout failed:', error);
            set({
              error: 'Failed to logout. Please try again.',
              isLoading: false
            });
            throw error;
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        }
      }
    }),
    {
      name: '11-11-auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        provider: state.provider
      }),
      // Don't persist error or loading states
      merge: (persistedState: any, currentState: any) => ({
        ...currentState,
        ...persistedState,
        error: currentState.error,
        isLoading: currentState.isLoading
      })
    }
  )
);

// Initialize auth store on import
useAuthStore.getState().actions.initializeAuth();

export default useAuthStore;