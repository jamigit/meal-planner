import { TAG_CATEGORIES } from '../constants/tagCategories.js'

function CategorizedTags({ recipe, className = '', showLegacy = false }) {
  const {
    cuisine_tags = [],
    ingredient_tags = [],
    convenience_tags = [],
    tags = []
  } = recipe

  const allTagsEmpty =
    cuisine_tags.length === 0 &&
    ingredient_tags.length === 0 &&
    convenience_tags.length === 0 &&
    (!showLegacy || tags.length === 0)

  if (allTagsEmpty) {
    return null
  }

  return (
    <div className={`flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${className}`}>
      <div className="flex flex-nowrap gap-2 min-w-max">
        {/* Cuisine Tags */}
        {cuisine_tags.map(tag => (
          <span key={`cuisine-${tag}`} className="tag-cuisine flex-shrink-0">
            {tag}
          </span>
        ))}

        {/* Ingredient Tags */}
        {ingredient_tags.map(tag => (
          <span key={`ingredient-${tag}`} className="tag-ingredients flex-shrink-0">
            {tag}
          </span>
        ))}

        {/* Convenience Tags */}
        {convenience_tags.map(tag => (
          <span key={`convenience-${tag}`} className="tag-convenience flex-shrink-0">
            {tag}
          </span>
        ))}

        {/* Legacy Tags */}
        {showLegacy && tags.map(tag => (
          <span key={`legacy-${tag}`} className="tag-legacy flex-shrink-0">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

export default CategorizedTags