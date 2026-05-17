import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { oauthUrl } from '../../config/api';
import { Loader2, AlertCircle } from 'lucide-react';

function dashboardFor(role) {
  if (role === 'super_admin') return '/admin/dashboard';
  if (role === 'investor') return '/dashboard/investor';
  return '/dashboard/entrepreneur';
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setError('');
    const result = await login(data);
    
    if (result.success) {
      const { user } = useAuthStore.getState();
      navigate(dashboardFor(user?.role));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEAEA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-[#FF5C00]/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <h2 className="mt-6 text-center text-3xl font-display font-black text-[#111111] tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-gray-500">
          Or{' '}
          <Link to="/register" className="font-bold text-[#FF5C00] hover:text-[#E65300] transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl border border-black/5 sm:rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-sm font-bold text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm"
                  placeholder="admin@founderdeck.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm font-semibold text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  type="password"
                  className="appearance-none block w-full px-3 py-2.5 border border-black/5 bg-[#F4F4F4] rounded-xl placeholder-gray-400 text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF5C00] focus:border-[#FF5C00] transition-shadow sm:text-sm"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-sm font-semibold text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#FF5C00] focus:ring-[#FF5C00] border-black/10 rounded bg-[#F4F4F4]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-semibold text-gray-500">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-bold text-[#FF5C00] hover:text-[#E65300] transition-colors">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-md shadow-[#FF5C00]/15 text-sm font-bold text-white bg-[#FF5C00] hover:bg-[#E65300] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5C00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/5" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-400 font-semibold">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <a
                href={oauthUrl('google')}
                className="w-full inline-flex justify-center py-2.5 px-4 border border-black/10 rounded-full bg-[#F4F4F4] text-sm font-bold text-gray-700 hover:bg-black/5 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                Sign in with Google
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
