import { Home, ArrowLeft } from 'lucide-react';
import Logo from '../components/ui/Logo';
import { Link, useRouter } from '../router';

export default function NotFound() {
  const { goBack } = useRouter();

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Logo size="lg" className="justify-center mb-8" linkTo="/" />

        <div className="mb-6">
          <div className="text-[120px] sm:text-[160px] font-bold leading-none text-dark-300 select-none">
            404
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => goBack()}
            className="btn-ghost px-6 py-3 text-sm flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            to="/"
            className="btn-primary px-6 py-3 text-sm flex items-center justify-center gap-2"
          >
            <Home size={16} /> Back to Home
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-300">
          <p className="text-gray-600 text-xs mb-4">Looking for something specific?</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm">
            <Link to="/workshops" className="text-gold-500 hover:text-gold-400 transition-colors">
              Browse Workshops
            </Link>
            <span className="hidden sm:inline text-gray-600">·</span>
            <Link to="/internships" className="text-gold-500 hover:text-gold-400 transition-colors">
              Browse Internships
            </Link>
            <span className="hidden sm:inline text-gray-600">·</span>
            <Link to="/login" className="text-gold-500 hover:text-gold-400 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
