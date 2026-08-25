import { createBrowserRouter } from 'react-router-dom';
import { BookingPage } from '../features/booking/BookingPage';
import { PublicGalleryPage } from '../features/booking/PublicGalleryPage';
import { ClientPortal } from '../features/booking/ClientPortal';
import { FindBooking } from '../features/booking/FindBooking';
import { AdminLayout } from '../shared/components/AdminLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AdminAppointmentsPage } from '../features/dashboard/AdminAppointmentsPage';
import { GalleryAdminPage } from '../features/dashboard/GalleryAdminPage';
import { SettingsAdminPage } from '../features/dashboard/SettingsAdminPage';
import { ServicesAdminPage } from '../features/services-admin/ServicesAdminPage';
import { StaffAdminPage } from '../features/staff-admin/StaffAdminPage';
import { AvailabilityManagerPage } from '../features/staff-admin/AvailabilityManagerPage';
import { ClientsAdminPage } from '../features/crm/ClientsAdminPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { OnboardingPage } from '../features/auth/OnboardingPage';
import { LandingPage } from '../features/landing/LandingPage';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/booking/:slug',
    element: <BookingPage />,
  },
  {
    path: '/booking/:slug/gallery',
    element: <PublicGalleryPage />,
  },
  {
    path: '/booking/:slug/status/:id',
    element: <ClientPortal />,
  },
  {
    path: '/booking/:slug/find',
    element: <FindBooking />,
  },
  {
    path: '/',
    element: <LandingPage />, 
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/admin',
    element: <ProtectedRoute />, // Protege todas las rutas hijas
    children: [
      {
        element: <AdminLayout />, // Layout se renderiza solo si ProtectedRoute pasa
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'appointments',
            element: <AdminAppointmentsPage />,
          },
          {
            path: 'services',
            element: <ServicesAdminPage />,
          },
          {
            path: 'staff',
            element: <StaffAdminPage />,
          },
          {
            path: 'staff/:barberId/availability',
            element: <AvailabilityManagerPage />,
          },
          {
            path: 'clients',
            element: <ClientsAdminPage />,
          },
          {
            path: 'gallery',
            element: <GalleryAdminPage />,
          },
          {
            path: 'settings',
            element: <SettingsAdminPage />,
          },
        ]
      }
    ],
  }
]);
