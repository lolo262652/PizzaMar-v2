import React from 'react'
import { Clock, MapPin, Phone } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-orange-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black bg-opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Les Meilleures
              <span className="text-orange-300"> Pizzas </span>
              de la Ville
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-red-100 leading-relaxed">
              Faites-vous livrer nos pizzas artisanales préparées avec des ingrédients frais et de qualité
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <a 
                href="#menu"
                className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-red-50 transition-colors shadow-lg"
              >
                Commander Maintenant
              </a>
              <a 
                href="#about"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-red-600 transition-colors"
              >
                En Savoir Plus
              </a>
            </div>

            {/* Info Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mt-12">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-orange-300" />
                <div className="font-semibold">Livraison Rapide</div>
                <div className="text-sm text-red-100">25-35 min</div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-orange-300" />
                <div className="font-semibold">Zone de Livraison</div>
                <div className="text-sm text-red-100">Toute la ville</div>
              </div>
              
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4 text-center">
                <Phone className="w-8 h-8 mx-auto mb-2 text-orange-300" />
                <div className="font-semibold">Commande Téléphone</div>
                <div className="text-sm text-red-100">01 23 45 67 89</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg"
                alt="Pizza artisanale"
                className="w-full h-96 lg:h-[500px] object-cover rounded-2xl shadow-2xl"
              />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-orange-500 text-white p-4 rounded-full shadow-lg animate-bounce">
              <span className="font-bold text-lg">🍕</span>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-yellow-500 text-white p-3 rounded-full shadow-lg">
              <span className="font-bold">⭐ 4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}