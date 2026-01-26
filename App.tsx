import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';
import { chatService } from './services/chatService';
import { ThemeProvider } from './services/ThemeContext';

// Pages
import Login from './pages/Login';
import ChatList from './pages/ChatList';
import ChatScreen from './pages/ChatScreen';
import Profile from './pages/Profile';
import PrivacySettings from './pages/PrivacySettings';

// Context for Auth
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = React.createContext<AuthContextType>({} as AuthContextType);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = chatService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    // This calls the service which signs in Firebase. 
    // The onAuthStateChanged listener above will actually update the local state.
    await chatService.login(email, password);
  };

  const logout = async () => {
    try {
      await chatService.logout();
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, login, logout, isLoading: loading }}>
        <Router>
          <AppRoutes />
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { user } = React.useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <ChatList /> : <Navigate to="/login" />} />
      <Route path="/chat/:chatId" element={user ? <ChatScreen /> : <Navigate to="/login" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/privacy" element={user ? <PrivacySettings /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
