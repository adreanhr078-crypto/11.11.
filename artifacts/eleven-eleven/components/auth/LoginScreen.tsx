/**
 * LoginScreen.tsx — Cinematic Login Interface for 11.11 Echo Mind System
 * AAA-grade authentication UI with glassmorphism and emotional design
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import '../../styles/auth.css';

export const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authStore = useAuthStore();

  // Handle login methods
  const handleLogin = async (method: 'google' | 'facebook' | 'guest') => {
    try {
      setIsLoading(true);
      setError(null);

      switch (method) {
        case 'google':
          await authStore.actions.loginWithGoogle();
          break;
        case 'facebook':
          await authStore.actions.loginWithFacebook();
          break;
        case 'guest':
          await authStore.actions.loginAsGuest();
          break;
      }

      // Navigate to main game after successful login
      window.location.href = '/';
    } catch (err) {
      console.error(`${method} login error:`, err);
      setError(`Failed to login with ${method}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-panel">
        <div className="login-header">
          <h1 className="login-title">11.11 — Echo Mind</h1>
          <p className="login-subtitle">Enter the emotional world</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-buttons">
          <button
            className="login-button google-button"
            onClick={() => handleLogin('google')}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span> Loading...
              </>
            ) : (
              <>
                <span className="google-icon">G</span> Continue with Google
              </>
            )}
          </button>

          <button
            className="login-button facebook-button"
            onClick={() => handleLogin('facebook')}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span> Loading...
              </>
            ) : (
              <>
                <span className="facebook-icon">f</span> Continue with Facebook
              </>
            )}
          </button>

          <button
            className="login-button guest-button"
            onClick={() => handleLogin('guest')}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span> Loading...
              </>
            ) : (
              <>
                <span className="guest-icon">👤</span> Play as Guest
              </>
            )}
          </button>
        </div>

        <div className="login-footer">
          <p className="login-info">
            All progress will be saved. Guest accounts can be upgraded later.
          </p>
        </div>
      </div>

      <div className="login-background">
        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;