import React, { useState } from 'react'
import { Pizza, User, ShoppingCart, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCartStore } from '../../stores/cartStore'
import NotificationCenter from '../Notifications/NotificationCenter'
import AuthModal from '../Auth/AuthModal'

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuthStore()
  const { toggleCart, getTotalItems } = useCartStore()

  const totalItems = getTotalItems()

  return (
    <>
      <header className="bg-white shadow-lg border-b-4 border-red-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <Pizza className="w-8 h-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">PizzaBuilder</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#menu" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                Menu
              </a>
              <a href="#about" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                À propos
              </a>
              <a href="#contact" className="text-gray-700 hover:text-red-600 font-medium transition-colors">
                Contact
              </a>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <NotificationCenter />
                  {user.email === 'laurent.habib@gmail.com' && (
                    <a
                      href="/admin"
                      className="text-gray-700 hover:text-red-600 font-medium transition-colors"
                    >
                      Admin
                    </a>
                  )}
                  <span className="text-gray-700">
                    Bonjour, {profile?.full_name || 'Client'}
                  </span>
                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                >
                  <User className="w-5 h-5" />
                  <span>Connexion</span>
                </button>
              )}
              {user && user.email === 'laurent.habib@gmail.com' && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 font-medium transition-colors"
                >
                  <User className="w-5 h-5" />
                  🔧 Admin
                </button>
              )}

              <button
                onClick={toggleCart}
                className="relative flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Panier</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-4">
                <a href="#menu" className="text-gray-700 hover:text-red-600 font-medium">
                  Menu
                </a>
                <a href="#about" className="text-gray-700 hover:text-red-600 font-medium">
                  À propos
                </a>
                <a href="#contact" className="text-gray-700 hover:text-red-600 font-medium">
                  Contact
                </a>
                
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex justify-center mb-4">
                        <NotificationCenter />
                      </div>
                      {user && user.email === 'laurent.habib@gmail.com' && (
                        <a
                          href="/admin"
                          className="block bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 font-medium mb-2 text-center"
                        >
                          🔧 Administration
                        </a>
                      )}
                      <p className="text-gray-700">
                        Bonjour, {profile?.full_name || 'Client'}
                      </p>
                      <button
                        onClick={signOut}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Déconnexion
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="flex items-center space-x-1 text-gray-700 hover:text-red-600"
                    >
                      <User className="w-5 h-5" />
                      <span>Connexion</span>
                    </button>
                  )}
                  
                  <button
                    onClick={toggleCart}
                    className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors mt-4 w-full justify-center relative"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Panier</span>
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}