import { Link } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';

const NotFoundPage = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
    <div className="text-center animate-fade-in">
      <div className="relative inline-block mb-8">
        <div className="text-9xl font-black text-gradient">404</div>
        <div className="absolute inset-0 text-9xl font-black text-primary-500/10 blur-xl">404</div>
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">
        <Home size={16} /> Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
