import React, { useState } from 'react';
// import { AuthContext } from '../App';
import Input from '../components/Input';
import Button from '../components/Button';
import { MessageCircle } from 'lucide-react';
import { chatService } from '../services/chatService';

const Login = () => {
  // const { login } = useContext(AuthContext); // Unused, avoiding TS error
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        // Реєстрація
        await chatService.register(email, password, displayName);
        // Після реєстрації Firebase зазвичай автоматично логінить, 
        // але AuthContext відловить зміну стану.
      } else {
        // Логін
        await chatService.login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Something went wrong. Check your credentials.";

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = "Invalid email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "That email is already in use.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Password should be at least 6 characters.";
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6">
          <MessageCircle className="h-9 w-9 text-white" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          {isRegistering ? 'Create Account' : 'Welcome back'}
        </h2>
        <p className="text-slate-500 mb-8">
          {isRegistering ? 'Sign up to start chatting' : 'Sign in to your account'}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegistering && (
              <Input
                id="name"
                type="text"
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required
              />
            )}

            <Input
              id="email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />

            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={loading}
            >
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </Button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {isRegistering
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
