import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const GuestHomePage = lazy(() => import('./pages/GuestHomePage'));
const VolunteerHomePage = lazy(() => import('./pages/VolunteerHomePage'));
const QuickStockPage = lazy(() => import('./pages/QuickStockPage'));
const NeighborHomePage = lazy(() => import('./pages/NeighborHomePage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const ReportBuilderPage = lazy(() => import('./pages/ReportBuilderPage'));
const EventsListPage = lazy(() => import('./pages/EventsListPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const SurveyPage = lazy(() => import('./pages/SurveyPage'));
const SurveyPrintPage = lazy(() => import('./pages/SurveyPrintPage'));
const SurveyResultsPage = lazy(() => import('./pages/SurveyResultsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));

// Pages are loaded on demand so the public pages - especially the survey,
// which people open on weak signal and limited data - don't download the
// charts library or Stripe (which SupportForms starts loading on import).

// Shown before anyone logs in, and while donating/contacting as a guest.
function GuestRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/support" element={<GuestHomePage />} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/survey/print" element={<SurveyPrintPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Shown once a volunteer/admin is logged in. Admin-only pages are reachable
// here too, but the buttons that link to them are hidden from volunteers in
// VolunteerHomePage - the actual enforcement happens server-side
// (requireStaff/requireAdmin), this is just about not showing dead ends.
function StaffRoutes() {
  return (
    <Routes>
      <Route path="/" element={<VolunteerHomePage />} />
      <Route path="/quick-stock" element={<QuickStockPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/budget" element={<BudgetPage />} />
      <Route path="/reports" element={<ReportBuilderPage />} />
      <Route path="/events" element={<EventsListPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      {/* Volunteers fill the survey out with people and type in paper ones. */}
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/survey/print" element={<SurveyPrintPage />} />
      <Route path="/survey/results" element={<SurveyResultsPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Shown once a neighbor is logged in. Deliberately its own route tree,
// separate from StaffRoutes, so there's no admin/volunteer page a neighbor
// could navigate to even by mistake - those routes simply aren't registered
// here.
function NeighborRoutes() {
  return (
    <Routes>
      <Route path="/" element={<NeighborHomePage />} />
      <Route path="/survey" element={<SurveyPage />} />
      <Route path="/survey/print" element={<SurveyPrintPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoading />;

  let routes = <StaffRoutes />;
  if (!user) routes = <GuestRoutes />;
  else if (user.role === 'neighbor') routes = <NeighborRoutes />;

  return <Suspense fallback={<FullPageLoading />}>{routes}</Suspense>;
}

function FullPageLoading() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <p className="body-muted">Loading…</p>
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
