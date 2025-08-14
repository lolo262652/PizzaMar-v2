import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Pizza, 
  Users, 
  ShoppingCart,
  Phone,
  Settings,
  LogOut,
  Home
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

const navigation = [
  { name: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { name: 'Catégories', href: '/admin/categories', icon: Tag },
  { name: 'Produits', href: '/admin/products', icon: Package },
  { name: 'Garnitures', href: '/admin/toppings', icon: Pizza },
  { name: 'Commandes Téléphone', href: '/admin/phone-orders', icon: Phone },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
]

export default function AdminLayout() {
  const location = useLocation()
  const { signOut, profile, user } = useAuthStore()

  // Vérification de sécurité
  if (!user || user.email !== 'laurent.habib@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Pizza className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès Refusé</h2>
          <p className="text-gray-600">Cette interface est réservée à l'administrateur.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <Pizza className="w-8 h-8 text-red-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Admin Panel</span>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-100 text-red-700 border-r-2 border-red-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {profile?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">Administrateur</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          <Link
            to="/"
            className="mt-3 flex items-center justify-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Retour au site
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}