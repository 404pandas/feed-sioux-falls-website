import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import GuestHomePage from './pages/GuestHomePage';
import VolunteerHomePage from './pages/VolunteerHomePage';
import QuickStockPage from './pages/QuickStockPage';
import NeighborHomePage from './pages/NeighborHomePage';
import InventoryPage from './pages/InventoryPage';
import BudgetPage from './pages/BudgetPage';
import ReportBuilderPage from './pages/ReportBuilderPage';
import EventsListPage from './pages/EventsListPage';
import EventDetailPage from './pages/EventDetailPage';

// Shown before anyone logs in, and while donating/contacting as a guest.
function GuestRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/support" element={<GuestHomePage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p className="body-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return <GuestRoutes />;
  if (user.role === 'neighbor') return <NeighborRoutes />;
  return <StaffRoutes />;
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
