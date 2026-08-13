import { createBrowserRouter } from 'react-router-dom';
import { BookingPage } from '../features/booking/BookingPage';
import { AdminLayout } from '../shared/components/AdminLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { AdminAppointmentsPage } from '../features/dashboard/AdminAppointmentsPage';
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
            path: 'settings',
            element: <SettingsAdminPage />,
          },
        ]
      }
    ],
  }
]);
