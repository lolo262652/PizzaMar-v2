import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import Header from './components/Layout/Header'
import HeroSection from './components/Hero/HeroSection'
import MenuSection from './components/Menu/MenuSection'
import CartSidebar from './components/Cart/CartSidebar'
import KitchenDashboard from './components/Kitchen/KitchenDashboard'
import AdminLayout from './components/Admin/AdminLayout'
import Dashboard from './components/Admin/Dashboard'
import CategoriesManager from './components/Admin/Categories/CategoriesManager'
import ProductsManager from './components/Admin/Products/ProductsManager'
import ToppingsManager from './components/Admin/Toppings/ToppingsManager'
import PhoneOrdersManager from './components/Admin/PhoneOrders/PhoneOrdersManager'
import UsersManager from './components/Admin/Users/UsersManager'
import OrdersManager from './components/Admin/Orders/OrdersManager'
import PaymentPage from './components/Payment/PaymentPage'

function HomePage() {
  return (
    <>
      <HeroSection />
      <MenuSection />
    </>
  )
}

// Protected Admin Route Component
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Vérifier si l'utilisateur est connecté et a l'email admin spécifique
  if (!user || user.email !== 'laurent.habib@gmail.com') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/kitchen" element={<KitchenDashboard />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<CategoriesManager />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="toppings" element={<ToppingsManager />} />
            <Route path="phone-orders" element={<PhoneOrdersManager />} />
            <Route path="users" element={<UsersManager />} />
            <Route path="orders" element={<OrdersManager />} />
          </Route>
          
          <Route path="/" element={
            <>
              <Header />
              <main>
                <HomePage />
              </main>
              <CartSidebar />
            </>
          } />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App