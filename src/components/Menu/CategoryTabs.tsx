import React from 'react'

interface Category {
  id: string
  name: string
  description: string | null
  display_order: number
}

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
}

export default function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-4 py-2 rounded-md font-medium whitespace-nowrap transition-all ${
          activeCategory === null
            ? 'bg-red-600 text-white shadow-md'
            : 'text-gray-600 hover:text-red-600 hover:bg-white'
        }`}
      >
        Tout
      </button>
      
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-4 py-2 rounded-md font-medium whitespace-nowrap transition-all ${
            activeCategory === category.id
              ? 'bg-red-600 text-white shadow-md'
              : 'text-gray-600 hover:text-red-600 hover:bg-white'
          }`}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}