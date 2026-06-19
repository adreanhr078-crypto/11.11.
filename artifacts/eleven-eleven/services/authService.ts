/**
 * Authentication Service for 11.11 Echo Mind System
 * Complete AAA-grade auth system with Google, Facebook, and Guest modes
 */

import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  linkWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  User,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../lib/firebase/config';

// Authentication Service Class
class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];
  private isLoading: boolean = true;

  constructor() {
    // Initialize auth state listener
    this.setupAuthListener();
  }

  // Setup authentication state listener
  private setupAuthListener(): void {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.isLoading = false;
      this.notifyAuthStateListeners(user);
    });
  }

  // Add auth state listener
  public onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);

    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  // Notify all listeners
  private notifyAuthStateListeners(user: User | null): void {
    this.authStateListeners.forEach((listener) => listener(user));
  }

  // Login with Google
  public async loginWithGoogle(): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Login with Facebook
  public async loginWithFacebook(): Promise<UserCredential> {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      return result;
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  // Login as Guest (Anonymous)
  public async loginAsGuest(): Promise<UserCredential> {
    try {
      const result = await signInAnonymously(auth);
      return result;
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    }
  }

  // Link Google account to existing user (for Guest upgrade)
  public async linkWithGoogle(): Promise<UserCredential> {
    if (!this.currentUser) {
      throw new Error('No current user to link with Google');
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      console.error('Google linking error:', error);
      throw error;
    }
  }

  // Link Facebook account to existing user (for Guest upgrade)
  public async linkWithFacebook(): Promise<UserCredential> {
    if (!this.currentUser) {
      throw new Error('No current user to link with Facebook');
    }

    try {
      const result = await signInWithPopup(auth, facebookProvider);
      return result;
    } catch (error) {
      console.error('Facebook linking error:', error);
      throw error;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get authentication state
  public getAuthState(): {
    user: User | null;
    isAuthenticated: boolean;
    isGuest: boolean;
    isLoading: boolean;
    provider: string | null;
  } {
    if (this.isLoading) {
      return {
        user: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: true,
        provider: null
      };
    }

    if (!this.currentUser) {
      return {
        user: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: false,
        provider: null
      };
    }

    return {
      user: this.currentUser,
      isAuthenticated: true,
      isGuest: this.currentUser.isAnonymous,
      isLoading: false,
      provider: this.currentUser.isAnonymous ? 'guest' :
                this.currentUser.providerData[0]?.providerId || null
    };
  }
}

// Singleton instance
const authService = new AuthService();

export default authService;