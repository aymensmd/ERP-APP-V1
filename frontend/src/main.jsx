import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { ContextProvider } from './contexts/ContextProvider.jsx'
import { CompanyProvider } from './contexts/CompanyContext.jsx'


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ContextProvider>
      <CompanyProvider>
        <RouterProvider router={router} />
      </CompanyProvider>
    </ContextProvider>
  </React.StrictMode>,
)
