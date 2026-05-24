import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw new Error(error.message);
        }

        if (!session) {
          // Sometimes it takes a brief moment, or it might be in the URL hash
          const { data, error: hashError } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (hashError) throw new Error(hashError.message);
          
          if (!data?.session) {
             throw new Error('No session found. Please try logging in again.');
          }
        }

        const activeSession = session || (await supabase.auth.getSession()).data.session;
        
        if (!activeSession?.access_token) {
          throw new Error('No access token available.');
        }

        // Send token to backend to establish FlowDesk session
        await loginWithGoogle(activeSession.access_token);
        
        toast.success('Successfully logged in with Google!');
        navigate('/');

      } catch (err) {
        console.error('OAuth callback error:', err);
        setErrorMsg(err.message || 'Authentication failed');
        toast.error('Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [navigate, loginWithGoogle]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-2xl border border-theme shadow-card text-center">
        {errorMsg ? (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-red-400 mb-2">Login Failed</h2>
            <p className="text-secondary-content mb-4">{errorMsg}</p>
            <p className="text-sm text-muted-content">Redirecting back to login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Loader size={48} className="animate-spin text-primary-500 mb-4" />
            <h2 className="text-2xl font-bold text-primary-content mb-2">Completing Login</h2>
            <p className="text-secondary-content">Please wait while we securely authenticate you...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
