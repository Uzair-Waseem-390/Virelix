import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
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
import PrivateRoute from './components/guards/PrivateRoute';
import PublicRoute from './components/guards/PublicRoute';
import AdminRoute from './components/guards/AdminRoute';
import Sidebar from './components/Sidebar';

// Placeholder components for dashboard
const AdminDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <Sidebar />
    <div className="ml-64 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Welcome to Admin Dashboard</p>
        </div>
      </div>
    </div>
  </div>
);

const ProjectDashboard = () => (
  <div className="min-h-screen bg-gray-50">
    <Sidebar />
    <div className="ml-64 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Project Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Welcome to your Project Dashboard</p>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/security" element={<SecurityPage />} />

        {/* Auth Routes (PublicRoute wrapper) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          {/* Profile route for all authenticated users */}
          <Route path="/dashboard/profile" element={<ProfilePage />} />

          {/* Admin only routes */}
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard/team" element={<TeamPage />} />
            <Route path="/dashboard/projects" element={<ProjectsPage />} />
          </Route>

          {/* General protected routes for all roles */}
          <Route path="/dashboard/projects/:projectId" element={<ProjectDashboard />} />

          {/* Products route - nested under project */}
          <Route path="/dashboard/projects/:projectId/products" element={<ProductsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;