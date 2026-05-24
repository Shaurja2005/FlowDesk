import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'email') {
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        await axiosInstance.post('/auth/verify-email', { token, type });
        setStatus('success');
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
        toast.error(err.response?.data?.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="max-w-md w-full bg-surface p-8 rounded-2xl border border-theme shadow-card text-center">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <Loader size={48} className="animate-spin text-primary-500 mb-4" />
            <h2 className="text-2xl font-bold text-primary-content mb-2">Verifying your email</h2>
            <p className="text-secondary-content">Please wait while we verify your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-primary-content mb-2">Email Verified!</h2>
            <p className="text-secondary-content mb-6">Your email address has been successfully verified.</p>
            <p className="text-sm text-muted-content">Redirecting to login...</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full mt-6">
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-fade-in">
            <XCircle size={64} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-primary-content mb-2">Verification Failed</h2>
            <p className="text-secondary-content mb-6">
              The verification link is invalid or has expired. Please try registering again or request a new link.
            </p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
