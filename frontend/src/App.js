/*import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage   from './pages/LandingPage';
import Home          from './pages/Home';
import AuthPage      from './pages/AuthPage';
import StudyRoom     from './pages/StudyRoom';
import ChapterView   from './pages/ChapterView';
import SchedulePage  from './pages/SchedulePage';
import ProfilePage   from './pages/ProfilePage';

function LandingOrHome() {
  const { user } = useAuth();
  return user ? <Home /> : <LandingPage />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' , background: 'var(--bg)',}}>
            <Navbar />
            <Routes>
              <Route path="/"          element={<LandingOrHome />} />
              <Route path="/login"     element={<AuthPage />} />
              <Route path="/study/:id"    element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
              <Route path="/chapters/:id" element={<ProtectedRoute><ChapterView /></ProtectedRoute>} />
              <Route path="/schedule"     element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
              <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;*/
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage    from './pages/LandingPage';
import Home           from './pages/Home';
import AuthPage       from './pages/AuthPage';
import StudyRoom      from './pages/StudyRoom';
import ChapterView    from './pages/ChapterView';
import SchedulePage   from './pages/SchedulePage';
import ProfilePage    from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';

function LandingOrHome() {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  if (user.isAdmin) return <Navigate to="/admin" replace />;
  return <Home />;
}

// Route protégée admin uniquement
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  // isAdmin vérifié côté backend, on laisse passer
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
            <Navbar />
            <Routes>
              <Route path="/"           element={<LandingOrHome />} />
              <Route path="/login"      element={<AuthPage />} />
              <Route path="/study/:id"     element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
              <Route path="/chapters/:id"  element={<ProtectedRoute><ChapterView /></ProtectedRoute>} />
              <Route path="/schedule"      element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
              <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/admin"         element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
