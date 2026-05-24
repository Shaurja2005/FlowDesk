import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import MainLayout from './layouts/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PendingVerificationPage from './pages/PendingVerificationPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsListPage from './pages/ProjectsListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TaskDetailPage from './pages/TaskDetailPage';
import MyTasksPage from './pages/MyTasksPage';
import NotificationsPage from './pages/NotificationsPage';
import ActivityPage from './pages/ActivityPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a2235',
                  color: '#f3f4f6',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#00C896', secondary: '#1a2235' } },
                error: { iconTheme: { primary: '#FF6B9D', secondary: '#1a2235' } },
              }}
            />

            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/pending-verification" element={<PendingVerificationPage />} />

              {/* Protected routes — inside MainLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsListPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="tasks" element={<MyTasksPage />} />
                <Route path="tasks/:id" element={<TaskDetailPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="pricing" element={<PricingPage />} />

                {/* Activity visible to everyone */}
                <Route
                  path="activity"
                  element={
                    <RoleRoute allowedRoles={['admin', 'manager', 'developer']}>
                      <ActivityPage />
                    </RoleRoute>
                  }
                />

                {/* Admin only */}
                <Route
                  path="team"
                  element={
                    <RoleRoute allowedRoles={['admin']}>
                      <TeamPage />
                    </RoleRoute>
                  }
                />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
