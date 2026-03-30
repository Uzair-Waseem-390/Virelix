import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SecurityPage from './pages/SecurityPage';
import ProfilePage from './pages/ProfilePage';
import TeamPage from './pages/TeamPage';
import ProjectsPage from './pages/ProjectsPage';
import ProductsPage from './pages/ProductsPage';
import InventoryPage from './pages/InventoryPage';
import MovementHistoryPage from './pages/MovementHistoryPage';
import SalesPage from './pages/SalesPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import PrivateRoute from './components/guards/PrivateRoute';
import PublicRoute from './components/guards/PublicRoute';
import AdminRoute from './components/guards/AdminRoute';
import AdminLayout from './components/layout/AdminLayout';
import ProjectLayout from './components/layout/ProjectLayout';
import AdminProjectRedirect from './components/layout/AdminProjectRedirect';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* Auth Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Admin Layout - Only accessible by admin */}
        <Route element={<PrivateRoute />}>
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="projects/:project_pk/enter" element={<AdminProjectRedirect />} />
            </Route>
          </Route>
        </Route>

        {/* Project Layout - Accessible by all authenticated users (with project access) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard/projects/:project_pk" element={<ProjectLayout />}>
            <Route index element={<ProjectDashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            {/* IMPORTANT: Specific route MUST come before generic route */}
            <Route path="inventory/:inventoryId/history" element={<MovementHistoryPage />} />
            <Route path="inventory/history" element={<MovementHistoryPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;