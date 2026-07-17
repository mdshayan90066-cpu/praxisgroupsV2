import { Suspense, lazy } from 'react';
import { RouterProvider, Routes, Route } from './router'; 

import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './admin/AdminAuth';

import { Skeleton } from './components/ui/Skeleton';

// =====================
// PUBLIC PAGES
// =====================
const Home = lazy(() => import('./pages/Home'));
const Workshops = lazy(() => import('./pages/Workshops'));
const WorkshopDetails = lazy(() => import('./pages/WorkshopDetails'));
const Internships = lazy(() => import('./pages/Internships'));
const InternshipDetails = lazy(() => import('./pages/InternshipDetails'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Resources = lazy(() => import('./pages/Resources'));
const ForCompanies = lazy(() => import('./pages/ForCompanies'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CertificateVerification = lazy(() => import('./pages/CertificateVerification'));
const NotFound = lazy(() => import('./pages/NotFound'));

// =====================
// LAYOUTS
// =====================
import StudentProtectedRoute from './student/StudentProtectedRoute';
import AdminLayout from './admin/AdminLayout';
import AdminProtectedRoute from './admin/AdminProtectedRoute';
import CompanyProtectedRoute from './company/CompanyProtectedRoute';

// =====================
// STUDENT PAGES
// =====================
const StudentDashboard = lazy(() => import('./student/Dashboard'));
const StudentProfile = lazy(() => import('./student/Profile'));
const StudentWorkshops = lazy(() => import('./student/MyWorkshops'));
const StudentInternships = lazy(() => import('./student/MyInternships'));
const StudentCertificates = lazy(() => import('./student/Certificates'));
const StudentPayments = lazy(() => import('./student/Payments'));
const StudentAttendance = lazy(() => import('./student/Attendance'));
const StudentAssignments = lazy(() => import('./student/Assignments'));
const StudentDownloads = lazy(() => import('./student/Downloads'));
const StudentSupport = lazy(() => import('./student/Support'));

// =====================
// ADMIN PAGES
// =====================
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));
const AdminStudents = lazy(() => import('./admin/AdminStudents'));
const AdminCompanies = lazy(() => import('./admin/AdminCompanies'));
const AdminWorkshops = lazy(() => import('./admin/AdminWorkshops'));
const AdminInternships = lazy(() => import('./admin/AdminInternships'));
const AdminCollaborations = lazy(() => import('./admin/AdminCollaborations'));
const AdminTeam = lazy(() => import('./admin/AdminTeam'));
const AdminApplications = lazy(() => import('./admin/AdminApplications'));
const AdminCertificates = lazy(() => import('./admin/AdminCertificates'));
const AdminPayments = lazy(() => import('./admin/AdminPayments'));
const AdminEmails = lazy(() => import('./admin/AdminEmails'));
const AdminAnalytics = lazy(() => import('./admin/AdminAnalytics'));
const AdminSettings = lazy(() => import('./admin/AdminSettings'));

// =====================
// COMPANY PAGES
// =====================
const CompanyLogin = lazy(() => import('./company/CompanyLogin'));
const CompanyDashboard = lazy(() => import('./company/Dashboard'));
const CompanyProfile = lazy(() => import('./company/Profile'));
const CompanyInternships = lazy(() => import('./company/CompanyInternships'));
const CompanyApplications = lazy(() => import('./company/Applications'));

// Structural Core Layout Router Wrapper
function ApplicationRouterCore() {
  return (
    <Suspense fallback={<Skeleton variant="page" />}>
      <Routes>
        {/* Public Marketing Routes */}
        <Route path="/" element={<Home />} />
        
        {/* Render Home landing fallback configuration for removed auth links */}
        <Route path="/login" element={<Home />} />
        <Route path="/signup" element={<Home />} />
        <Route path="/forgot-password" element={<Home />} />
        <Route path="/reset-password" element={<Home />} />
        
        <Route path="/workshops" element={<Workshops />} />
        <Route path="/workshops/:id" element={<WorkshopDetails />} />
        <Route path="/internships" element={<Internships />} />
        <Route path="/internships/:id" element={<InternshipDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/for-companies" element={<ForCompanies />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/verify-certificate" element={<CertificateVerification />} />

        {/* STUDENT PORTAL ROUTES */}
        <Route path="/student" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />
        <Route path="/student/dashboard" element={<StudentProtectedRoute><StudentDashboard /></StudentProtectedRoute>} />
        <Route path="/student/workshops" element={<StudentProtectedRoute><StudentWorkshops /></StudentProtectedRoute>} />
        <Route path="/student/internships" element={<StudentProtectedRoute><StudentInternships /></StudentProtectedRoute>} />
        <Route path="/student/assignments" element={<StudentProtectedRoute><StudentAssignments /></StudentProtectedRoute>} />
        <Route path="/student/attendance" element={<StudentProtectedRoute><StudentAttendance /></StudentProtectedRoute>} />
        <Route path="/student/certificates" element={<StudentProtectedRoute><StudentCertificates /></StudentProtectedRoute>} />
        <Route path="/student/payments" element={<StudentProtectedRoute><StudentPayments /></StudentProtectedRoute>} />
        <Route path="/student/downloads" element={<StudentProtectedRoute><StudentDownloads /></StudentProtectedRoute>} />
        <Route path="/student/support" element={<StudentProtectedRoute><StudentSupport /></StudentProtectedRoute>} />
        <Route path="/student/profile" element={<StudentProtectedRoute><StudentProfile /></StudentProtectedRoute>} />

        {/* COMPANY PORTAL ROUTES */}
        <Route path="/company" element={<CompanyProtectedRoute><CompanyDashboard /></CompanyProtectedRoute>} />
        <Route path="/company/dashboard" element={<CompanyProtectedRoute><CompanyDashboard /></CompanyProtectedRoute>} />
        <Route path="/company/internships" element={<CompanyProtectedRoute><CompanyInternships /></CompanyProtectedRoute>} />
        <Route path="/company/applications" element={<CompanyProtectedRoute><CompanyApplications /></CompanyProtectedRoute>} />
        <Route path="/company/profile" element={<CompanyProtectedRoute><CompanyProfile /></CompanyProtectedRoute>} />
        <Route path="/company/login" element={<CompanyLogin />} />

        {/* ADMIN PANEL HIGHWAY ROUTES */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/students" element={<AdminProtectedRoute><AdminLayout><AdminStudents /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/companies" element={<AdminProtectedRoute><AdminLayout><AdminCompanies /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/workshops" element={<AdminProtectedRoute><AdminLayout><AdminWorkshops /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/internships" element={<AdminProtectedRoute><AdminLayout><AdminInternships /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/collaborations" element={<AdminProtectedRoute><AdminLayout><AdminCollaborations /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/team" element={<AdminProtectedRoute><AdminLayout><AdminTeam /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/applications" element={<AdminProtectedRoute><AdminLayout><AdminApplications /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/certificates" element={<AdminProtectedRoute><AdminLayout><AdminCertificates /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/payments" element={<AdminProtectedRoute><AdminLayout><AdminPayments /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/emails" element={<AdminProtectedRoute><AdminLayout><AdminEmails /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminLayout><AdminAnalytics /></AdminLayout></AdminProtectedRoute>} />
        <Route path="/admin/settings" element={<AdminProtectedRoute><AdminLayout><AdminSettings /></AdminLayout></AdminProtectedRoute>} />
        
        {/* Fallback Catch-All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

// Master Global Context Entry Point
export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <ApplicationRouterCore />
        </AdminAuthProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
