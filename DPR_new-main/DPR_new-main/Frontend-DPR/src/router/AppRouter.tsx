import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MainLayout } from '../layout';
import { Login } from '../features/authentication';
import { 
  Dashboard, 
  UploadDocuments, 
  Reports, 
  GeospatialVerification, 
  Settings, 
  Profile, 
  AllDocuments, 
  HelpSupport,
  AnalysisDashboard 
} from '../pages';

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <MainLayout userRole={user?.roleType || 'public'}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<UploadDocuments />} />
        <Route path="/analysis" element={<AnalysisDashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/geo-verification" element={<GeospatialVerification />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/documents" element={<AllDocuments />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </MainLayout>
  );
};

export const AppRouter = () => (
  <Router>
    <AppRoutes />
  </Router>
);
