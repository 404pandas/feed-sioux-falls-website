import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public site
const HomePage = lazy(() => import('./pages/public/HomePage'));
const GetHelpPage = lazy(() => import('./pages/public/GetHelpPage'));
const GivePage = lazy(() => import('./pages/public/GivePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const SurveyPage = lazy(() => import('./pages/SurveyPage'));
const SurveyPrintPage = lazy(() => import('./pages/SurveyPrintPage'));

// Staff app (volunteers and admins)
const StaffHomePage = lazy(() => import('./pages/staff/StaffHomePage'));
const InventoryPage = lazy(() => import('./pages/staff/InventoryPage'));
const VolunteerHomePage = lazy(() => import('./pages/VolunteerHomePage'));

// Admin only
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const ReportBuilderPage = lazy(() => import('./pages/ReportBuilderPage'));
const EventsListPage = lazy(() => import('./pages/EventsListPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const SurveyResultsPage = lazy(() => import('./pages/SurveyResultsPage'));
const SurveyResponsesPage = lazy(() => import('./pages/admin/SurveyResponsesPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const DataHomePage = lazy(() => import('./pages/admin/DataHomePage'));
const DataCollectionPage = lazy(() => import('./pages/admin/DataCollectionPage'));

// Pages load on demand, so the public pages - especially the survey, which
// people open on weak signal and limited data - never download the charts
// library, Stripe, or any of the staff screens.

// The public website. Guests and logged-in neighbors see the same pages.
function PublicRoutes({ isGuest }) {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/help" element={<GetHelpPage />} />
      <Route path="/give" element={<GivePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/survey/print" element={<SurveyPrintPage />} />
      <Route path="/login" element={isGuest ? <LoginPage /> : <Navigate to="/" replace />} />
      {/* v1 address for the guest page */}
      <Route path="/support" element={<Navigate to="/give" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Volunteers and admins. Admin pages are guarded here so volunteers never
// land on a page that would only show "Admins only" - the real protection
// is still on the server (requireAdmin).
function StaffRoutes({ isAdmin }) {
  const admin = (element) => (isAdmin ? element : <Navigate to="/dashboard" replace />);
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<StaffHomePage />} />
      <Route path="/today" element={<VolunteerHomePage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/quick-stock" element={<Navigate to="/inventory" replace />} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/survey/print" element={<SurveyPrintPage />} />

      {/* The public pages, so staff can see what neighbors see. */}
      <Route path="/site" element={<HomePage />} />
      <Route path="/help" element={<GetHelpPage />} />
      <Route path="/give" element={<GivePage />} />
      <Route path="/about" element={<AboutPage />} />

      <Route path="/budget" element={admin(<BudgetPage />)} />
      <Route path="/reports" element={admin(<ReportBuilderPage />)} />
      <Route path="/events" element={admin(<EventsListPage />)} />
      <Route path="/events/:eventId" element={admin(<EventDetailPage />)} />
      <Route path="/messages" element={admin(<MessagesPage />)} />
      <Route path="/survey/results" element={admin(<SurveyResultsPage />)} />
      <Route path="/survey/responses" element={admin(<SurveyResponsesPage />)} />
      <Route path="/data" element={admin(<DataHomePage />)} />
      <Route path="/data/:key" element={admin(<DataCollectionPage />)} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function RootRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoading />;

  const isStaff = user && (user.role === 'admin' || user.role === 'volunteer');
  return (
    <Suspense fallback={<FullPageLoading />}>
      {isStaff ? <StaffRoutes isAdmin={user.role === 'admin'} /> : <PublicRoutes isGuest={!user} />}
    </Suspense>
  );
}

function FullPageLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <img src="/brand/heart.png" alt="Loading" style={{ height: 64, opacity: 0.6 }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RootRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
