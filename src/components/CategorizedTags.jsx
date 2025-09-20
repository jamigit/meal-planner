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
    <div className={`flex flex-wrap ${className}`}>
      {/* Cuisine Tags */}
      {cuisine_tags.map(tag => (
        <span key={`cuisine-${tag}`} className="tag-cuisine">
          {tag}
        </span>
      ))}

      {/* Ingredient Tags */}
      {ingredient_tags.map(tag => (
        <span key={`ingredient-${tag}`} className="tag-ingredients">
          {tag}
        </span>
      ))}

      {/* Convenience Tags */}
      {convenience_tags.map(tag => (
        <span key={`convenience-${tag}`} className="tag-convenience">
          {tag}
        </span>
      ))}

      {/* Legacy Tags */}
      {showLegacy && tags.map(tag => (
        <span key={`legacy-${tag}`} className="tag-legacy">
          {tag}
        </span>
      ))}
    </div>
  )
}

export default CategorizedTags