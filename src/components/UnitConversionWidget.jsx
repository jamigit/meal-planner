import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { convertUnit, getConversionSuggestions, suggestUnitsForItem, getUnitCategories } from '../utils/unitConversion.js'
import Button from './ui/Button'
import Input from './ui/Input'

function UnitConversionWidget({ 
  itemName, 
  currentQuantity, 
  currentUnit, 
  onConvert,
  className = '' 
}) {
  const [showConverter, setShowConverter] = useState(false)
  const [targetUnit, setTargetUnit] = useState('')
  const [convertedValue, setConvertedValue] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [unitCategories, setUnitCategories] = useState({})

  useEffect(() => {
    setUnitCategories(getUnitCategories())
  }, [])

  useEffect(() => {
    if (currentQuantity && currentUnit && showConverter) {
      updateSuggestions()
    }
  }, [currentQuantity, currentUnit, showConverter])

  const updateSuggestions = () => {
    if (!currentQuantity || !currentUnit) return
    
    const newSuggestions = getConversionSuggestions(currentUnit, parseFloat(currentQuantity))
    setSuggestions(newSuggestions)
  }

  const handleUnitChange = (newUnit) => {
    setTargetUnit(newUnit)
    
    if (currentQuantity && newUnit) {
      const converted = convertUnit(parseFloat(currentQuantity), currentUnit, newUnit)
      setConvertedValue(converted)
    }
  }

  const handleConvert = () => {
    if (convertedValue !== null && targetUnit) {
      onConvert({
        quantity: convertedValue.toString(),
        unit: targetUnit
      })
      setShowConverter(false)
      setTargetUnit('')
      setConvertedValue(null)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    onConvert({
      quantity: suggestion.value.toString(),
      unit: suggestion.unit
    })
    setShowConverter(false)
  }

  const getSuggestedUnits = () => {
    if (itemName) {
      return suggestUnitsForItem(itemName)
    }
    return ['piece', 'cup', 'lb']
  }

  if (!currentQuantity || !currentUnit) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Convert Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowConverter(!showConverter)}
        className="w-full"
      >
        {showConverter ? 'Hide Converter' : 'Convert Units'}
      </Button>

      {/* Converter Panel */}
      <AnimatePresence>
        {showConverter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-3 rounded-lg space-y-3"
          >
            {/* Current Value */}
            <div className="text-sm text-gray-600">
              Current: {currentQuantity} {currentUnit}
            </div>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Quick Convert:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200 transition-colors"
                    >
                      {suggestion.displayValue} {suggestion.unit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Conversion */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">Convert to:</div>
              <div className="flex gap-2">
                <select
                  value={targetUnit}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select unit</option>
                  {Object.entries(unitCategories).map(([categoryKey, category]) => (
                    <optgroup key={categoryKey} label={`${category.icon} ${category.name}`}>
                      {category.units.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                
                {convertedValue !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      = {convertedValue} {targetUnit}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleConvert}
                      disabled={!targetUnit}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Units for Item */}
            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Suggested for this item:</div>
              <div className="flex flex-wrap gap-2">
                {getSuggestedUnits().map((unit, index) => (
                  <button
                    key={index}
                    onClick={() => handleUnitChange(unit)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      targetUnit === unit
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UnitConversionWidget
