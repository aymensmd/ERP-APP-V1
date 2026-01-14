import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from './views/Login';
import NotFound from './views/NotFound';
import DefaultLayout from './components/DefaultLayout';
import App from './App';
import Dashboard from './views/Dashboard';
import UserSettingView from './views/UserSettingView';
import Unauthorized from './views/Unauthorized';
import PrivateRoute from './contexts/PrivateRoute';
import ProfilePage from './views/ProfilePage';
import MessageComponent from './views/MessageComponent';
import SettingsPage from './views/SettingsPage';
import WelcomePage from './views/WelcomePage'; // Import WelcomePage
import DemoRequest from './views/DemoRequest'; // Import DemoRequest
import Projects from './views/Projects';
import Calendar from './views/Calendar';
import Notifications from './views/Notifications';
import Reports from './views/Reports';
import Analytics from './views/Analytics';
import HelpCenter from './views/HelpCenter';
import KnowledgeBase from './views/KnowledgeBase';
import TimeTracking from './views/TimeTracking';
import Surveys from './views/Surveys';
import Rewards from './views/Rewards';
import WorkflowBuilder from './views/WorkflowBuilder'; // Import WorkflowBuilder
import ActivityLogs from './views/ActivityLogs'; // Import ActivityLogs
import Leads from './views/Leads'; // Import Leads
import KanbanBoards from './views/KanbanBoards'; // Import KanbanBoards
import OrganizationalChartPage from './views/OrganizationalChartPage'; // Import OrganizationalChartPage
import Customers from './views/Customers'; // Import Customers
import Invoices from './views/Invoices'; // Import Invoices
import Onboarding from './views/Onboarding'; // Import Onboarding
import Shifts from './views/Shifts'; // Import Shifts
import Attendance from './views/Attendance';
import React, { Suspense } from 'react';

// Lazy-load feature pages to reduce initial bundle size
const Achievements = React.lazy(() => import('./views/Achievements'));
const TaskManagement = React.lazy(() => import('./views/TaskManagement'));
const Performance = React.lazy(() => import('./views/Performance'));
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <DefaultLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/welcome" replace /> // Redirect root to welcome
      },
      {
        path: '/welcome',
        element: <WelcomePage /> // New welcome route
      },
      {
        path: '/app',
        element: <App />,
      },
      {
        path: '/dashboard',
        element: (
          <PrivateRoute requiredPermissions={['dashboard.view']}>
            <Dashboard />
          </PrivateRoute>
        )
      },
      {
        path: '/achievements',
        element: (
          <PrivateRoute requiredPermissions={['dashboard.view']}>
            <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
              <Achievements />
            </Suspense>
          </PrivateRoute>
        )
      },
      {
        path: '/tasks',
        element: (
          <PrivateRoute requiredPermissions={['kanban.view']}>
            <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
              <TaskManagement />
            </Suspense>
          </PrivateRoute>
        )
      },
      {
        path: '/performance',
        element: (
          <PrivateRoute requiredPermissions={['analytics.view']}>
            <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
              <Performance />
            </Suspense>
          </PrivateRoute>
        )
      },
      {
        path: '/profile',
        element: <ProfilePage /> // Profile accessible to all authenticated users
      },
      {
        path: '/settings',
        element: (
          <PrivateRoute requiredPermissions={['settings.view']}>
            <SettingsPage />
          </PrivateRoute>
        )
      },
      {
        path: '/dash/chat',
        element: <MessageComponent /> // Chat accessible to all authenticated users
      },
      {
        path: '/demo-request',
        element: <DemoRequest /> // Demo request accessible to all
      },
      {
        path: '/projects',
        element: (
          <PrivateRoute requiredPermissions={['projects.view']}>
            <Projects />
          </PrivateRoute>
        )
      },
      {
        path: '/calendar',
        element: (
          <PrivateRoute requiredPermissions={['events.view']}>
            <Calendar />
          </PrivateRoute>
        )
      },
      {
        path: '/notifications',
        element: <Notifications /> // Notifications accessible to all authenticated users
      },
      {
        path: '/reports',
        element: (
          <PrivateRoute requiredPermissions={['reports.view']}>
            <Reports />
          </PrivateRoute>
        )
      },
      {
        path: '/analytics',
        element: (
          <PrivateRoute requiredPermissions={['analytics.view']}>
            <Analytics />
          </PrivateRoute>
        )
      },
      {
        path: '/help',
        element: <HelpCenter /> // Help accessible to all authenticated users
      },
      {
        path: '/knowledge',
        element: <KnowledgeBase /> // Knowledge base accessible to all authenticated users
      },
      {
        path: '/timetracking',
        element: (
          <PrivateRoute requiredPermissions={['time-tracking.view']}>
            <TimeTracking />
          </PrivateRoute>
        )
      },
      {
        path: '/attendance',
        element: (
          <PrivateRoute requiredPermissions={['attendance.view','time-tracking.view']} anyPermission={true}>
            <Attendance />
          </PrivateRoute>
        )
      },
      {
        path: '/surveys',
        element: (
          <PrivateRoute requiredPermissions={['dashboard.view']}>
            <Surveys />
          </PrivateRoute>
        )
      },
      {
        path: '/rewards',
        element: (
          <PrivateRoute requiredPermissions={['dashboard.view']}>
            <Rewards />
          </PrivateRoute>
        )
      },
      {
        path: '/workflow-builder',
        element: (
          <PrivateRoute requiredPermissions={['workflows.view']}>
            <WorkflowBuilder />
          </PrivateRoute>
        )
      },
      // Protected routes with permission checks
      {
        path: '/activity-logs',
        element: (
          <PrivateRoute requiredPermissions={['audit-logs.view']}>
            <ActivityLogs />
          </PrivateRoute>
        )
      },
      {
        path: '/leads',
        element: (
          <PrivateRoute requiredPermissions={['leads.view']}>
            <Leads />
          </PrivateRoute>
        )
      },
      {
        path: '/customers',
        element: (
          <PrivateRoute requiredPermissions={['customers.view']}>
            <Customers />
          </PrivateRoute>
        )
      },
      {
        path: '/invoices',
        element: (
          <PrivateRoute requiredPermissions={['invoices.view']}>
            <Invoices />
          </PrivateRoute>
        )
      },
      {
        path: '/kanban',
        element: (
          <PrivateRoute requiredPermissions={['kanban.view']}>
            <KanbanBoards />
          </PrivateRoute>
        )
      },
      {
        path: '/organizational-chart',
        element: (
          <PrivateRoute requiredPermissions={['org-chart.view']}>
            <OrganizationalChartPage />
          </PrivateRoute>
        )
      },
      {
        path: '/onboarding',
        element: (
          <PrivateRoute requiredPermissions={['onboarding.view']}>
            <Onboarding />
          </PrivateRoute>
        )
      },
      {
        path: '/shifts',
        element: (
          <PrivateRoute requiredPermissions={['shifts.view']}>
            <Shifts />
          </PrivateRoute>
        )
      },
      {
        path: '/leaves',
        element: (
          <PrivateRoute requiredPermissions={['vacations.view']}>
            <UserSettingView />
          </PrivateRoute>
        )
      },
      // HR Management routes - Admin and Manager only
      {
        path: '/users_setting',
        element: (
          <PrivateRoute 
            allowedRoles={['admin', 'manager']}
            requiredPermissions={['employees.view']}
          >
            <UserSettingView />
          </PrivateRoute>
        )
      },
    ]
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;
