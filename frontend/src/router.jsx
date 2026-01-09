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
        element: <Dashboard />
      },
      {
        path: '/achievements',
        element: (
          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
            <Achievements />
          </Suspense>
        )
      },
      {
        path: '/tasks',
        element: (
          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
            <TaskManagement />
          </Suspense>
        )
      },
      {
        path: '/performance',
        element: (
          <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
            <Performance />
          </Suspense>
        )
      },
      {
        path: '/profile',
        element: <ProfilePage />
      },
      {
        path: '/settings',
        element: <SettingsPage />
      },
      {
        path: '/dash/chat',
        element: <MessageComponent />
      },
      {
        path: '/demo-request',
        element: <DemoRequest />
      },
      {
        path: '/projects',
        element: <Projects />
      },
      {
        path: '/calendar',
        element: <Calendar />
      },
      {
        path: '/notifications',
        element: <Notifications />
      },
      {
        path: '/reports',
        element: <Reports />
      },
      {
        path: '/analytics',
        element: <Analytics />
      },
      {
        path: '/help',
        element: <HelpCenter />
      },
      {
        path: '/knowledge',
        element: <KnowledgeBase />
      },
      {
        path: '/timetracking',
        element: <TimeTracking />
      },
      {
        path: '/surveys',
        element: <Surveys />
      },
      {
        path: '/rewards',
        element: <Rewards />
      },
      {
        path: '/workflow-builder',
        element: <WorkflowBuilder /> // New WorkflowBuilder route
      },
      {
        path: '/activity-logs',
        element: <ActivityLogs /> // Activity Logs route
      },
      {
        path: '/leads',
        element: <Leads /> // Leads management route
      },
      {
        path: '/customers',
        element: <Customers /> // Customers management route
      },
      {
        path: '/invoices',
        element: <Invoices /> // Invoices management route
      },
      {
        path: '/onboarding',
        element: <Onboarding /> // Employee Onboarding route
      },
      {
        path: '/shifts',
        element: <Shifts /> // Shift Management route
      },
      {
        path: '/kanban',
        element: <KanbanBoards /> // Kanban boards route
      },
      {
        path: '/organizational-chart',
        element: <OrganizationalChartPage /> // Organizational chart route
      },
      // HR Management routes - only visible to admin
      {
        path: '/users_setting',
        element: (
          <PrivateRoute allowedRoles={['admin']}>
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