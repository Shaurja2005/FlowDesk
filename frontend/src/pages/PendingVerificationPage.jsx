import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const PendingVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    try {
      setLoading(true);
      await axiosInstance.post('/auth/resend-verification', { email });
      toast.success('Verification email resent! Please check your inbox.');
      setCooldown(60);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="max-w-md w-full bg-dark-800 p-8 rounded-2xl border border-theme shadow-card text-center">
        <div className="mx-auto w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-6">
          <Mail size={32} className="text-primary-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400 mb-6">
          We've sent a verification link to <span className="text-white font-medium">{email}</span>. 
          Please click the link to verify your account before logging in.
        </p>

        <button 
          onClick={() => navigate('/login')} 
          className="btn-primary w-full mb-4 flex items-center justify-center gap-2"
        >
          Go to Login <ArrowRight size={18} />
        </button>

        <div className="mt-8 pt-6 border-t border-theme">
          <p className="text-sm text-gray-500 mb-3">Didn't receive the email?</p>
          <button 
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              cooldown > 0 || loading
                ? 'bg-dark-700 text-gray-500 cursor-not-allowed'
                : 'bg-dark-700 hover:bg-dark-600 text-white'
            }`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Verification Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingVerificationPage;
