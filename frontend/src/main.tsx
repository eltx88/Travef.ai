import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import RouteLayout from './layouts/RouteLayout.tsx'
import LandingPage from './routes/Landingpage.tsx'
import HomePage from './routes/Homepage.tsx'
import PointOfInterest from './routes/PointOfInterespage.tsx'
import CreateTrip from './routes/CreateTrippage.tsx'
import CustomTrip from './routes/CustomTrippage.tsx'
import EditTripPage from './routes/EditTripPage.tsx'
import AuthRoute from './components/AuthRoute/AuthRoute.tsx'
import './index.css'

const router = createBrowserRouter([
  { 
    path: '/', 
    element: <RouteLayout/>, 
    children: [
      {
        path: '/',
        element: <LandingPage/>,
      },
      {
        path: '/home', 
        element: (
          <AuthRoute>
            <HomePage/>
          </AuthRoute>
        ),
      },
      {
        path: '/poi', 
        element: (
          <AuthRoute>
            <PointOfInterest/>
          </AuthRoute>
        ),
      },
      {
        path: '/createtrip', 
        element: (
          <AuthRoute>
            <CreateTrip/>
          </AuthRoute>
        ),
      },
      {
        path: '/custom-trip', 
        element: (
          <AuthRoute>
            <CustomTrip/>
          </AuthRoute>
        ),
      },
      {
        path: '/edit-trip', 
        element: (
          <AuthRoute>
            <EditTripPage/>
          </AuthRoute>
        ),
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router = {router}/>
  </React.StrictMode>,
)
