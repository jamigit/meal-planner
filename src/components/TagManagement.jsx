import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TAG_TAXONOMY } from '../constants/recipeTags.js'
import { getCategoryDisplayName, getCategoryColorClasses } from '../constants/recipeTags.js'
import { tagManagementService } from '../services/tagManagementService.js'
import { tagAnalytics } from '../utils/tagAnalytics.js'

export default function TagManagement() {
  const [tagUsage, setTagUsage] = useState({})
  const [editingTag, setEditingTag] = useState(null)
  const [newTagName, setNewTagName] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({
    cuisine_tags: true,
    ingredient_tags: true,
    convenience_tags: true,
    dietary_tags: true
  })

  // Load tag usage statistics
  useEffect(() => {
    loadTagUsage()
  }, [])

  const loadTagUsage = async () => {
    setIsLoading(true)
    try {
      const usage = await tagAnalytics.getTagUsageStats()
      setTagUsage(usage)
    } catch (error) {
      console.error('Failed to load tag usage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditTag = (category, oldName) => {
    setEditingTag({ category, oldName })
    setNewTagName(oldName)
  }

  const handleSaveEdit = async () => {
    if (!editingTag || !newTagName.trim()) return

    try {
      const result = await tagManagementService.renameTag(
        editingTag.category,
        editingTag.oldName,
        newTagName.trim()
      )
      
      if (result.success) {
        // Reload usage stats
        await loadTagUsage()
        setEditingTag(null)
        setNewTagName('')
      } else {
        alert(`Failed to rename tag: ${result.error}`)
      }
    } catch (error) {
      console.error('Error renaming tag:', error)
      alert('Failed to rename tag')
    }
  }

  const handleDeleteTag = async (category, tagName) => {
    const replacementTag = prompt(
      `Enter replacement tag for "${tagName}" (or leave empty to remove):`
    )
    
    if (replacementTag === null) return // User cancelled

    try {
      const result = await tagManagementService.deleteTag(
        category,
        tagName,
        replacementTag || null
      )
      
      if (result.success) {
        await loadTagUsage()
        alert(`Tag deleted. ${result.recipesAffected} recipes updated.`)
      } else {
        alert(`Failed to delete tag: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting tag:', error)
      alert('Failed to delete tag')
    }
  }

  const handleAddNewTag = async (category) => {
    const tagName = prompt(`Enter new tag name for ${getCategoryDisplayName(category)}:`)
    if (!tagName || !tagName.trim()) return

    try {
      const result = await tagManagementService.addNewTag(category, tagName.trim())
      
      if (result.success) {
        await loadTagUsage()
        alert('Tag added successfully')
      } else {
        alert(`Failed to add tag: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding tag:', error)
      alert('Failed to add tag')
    }
  }

  const handleMergeTags = async () => {
    if (selectedTags.length < 2) {
      alert('Select at least 2 tags to merge')
      return
    }

    const targetTag = prompt('Enter the target tag name to merge into:')
    if (!targetTag || !targetTag.trim()) return

    try {
      const result = await tagManagementService.mergeTags(
        selectedTags[0].category,
        selectedTags.map(t => t.name),
        targetTag.trim()
      )
      
      if (result.success) {
        await loadTagUsage()
        setSelectedTags([])
        alert(`Tags merged. ${result.recipesAffected} recipes updated.`)
      } else {
        alert(`Failed to merge tags: ${result.error}`)
      }
    } catch (error) {
      console.error('Error merging tags:', error)
      alert('Failed to merge tags')
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTags.length === 0) {
      alert('Select tags to delete')
      return
    }

    if (!confirm(`Delete ${selectedTags.length} selected tags?`)) return

    try {
      let totalAffected = 0
      for (const tag of selectedTags) {
        const result = await tagManagementService.deleteTag(tag.category, tag.name)
        if (result.success) {
          totalAffected += result.recipesAffected
        }
      }
      
      await loadTagUsage()
      setSelectedTags([])
      alert(`Deleted ${selectedTags.length} tags. ${totalAffected} recipes updated.`)
    } catch (error) {
      console.error('Error deleting tags:', error)
      alert('Failed to delete tags')
    }
  }

  const toggleTagSelection = (category, tagName) => {
    const tagKey = `${category}:${tagName}`
    setSelectedTags(prev => {
      const exists = prev.some(t => t.category === category && t.name === tagName)
      if (exists) {
        return prev.filter(t => !(t.category === category && t.name === tagName))
      } else {
        return [...prev, { category, name: tagName }]
      }
    })
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const filteredTags = useCallback(() => {
    const filtered = {}
    
    Object.entries(TAG_TAXONOMY).forEach(([category, tags]) => {
      if (searchTerm) {
        filtered[category] = tags.filter(tag =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getCategoryDisplayName(category).toLowerCase().includes(searchTerm.toLowerCase())
        )
      } else {
        filtered[category] = tags
      }
    })
    
    return filtered
  }, [searchTerm])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tag Management</h1>
          <p className="text-gray-600">
            Manage your recipe tags: rename, delete, add new tags, or merge similar ones.
          </p>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              {selectedTags.length > 0 && (
                <>
                  <button
                    onClick={handleMergeTags}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Merge Selected ({selectedTags.length})
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Selected ({selectedTags.length})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tag Categories */}
        <div className="space-y-6">
          {Object.entries(filteredTags()).map(([category, tags]) => (
            <div key={category} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Category Header */}
              <div
                className="px-6 py-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {getCategoryDisplayName(category)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({tags.length} tags)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddNewTag(category)
                      }}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      + Add Tag
                    </button>
                    <motion.div
                      animate={{ rotate: expandedCategories[category] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Tags List */}
              <AnimatePresence>
                {expandedCategories[category] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tags.map(tag => {
                          const usage = tagUsage[category]?.[tag] || 0
                          const isSelected = selectedTags.some(t => t.category === category && t.name === tag)
                          const isEditing = editingTag?.category === category && editingTag?.oldName === tag
                          
                          return (
                            <div
                              key={tag}
                              className={`p-4 border rounded-lg transition-all ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleTagSelection(category, tag)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColorClasses(category)}`}>
                                    {tag}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleEditTag(category, tag)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Edit tag"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTag(category, tag)}
                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete tag"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                  />
                                  <button
                                    onClick={handleSaveEdit}
                                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTag(null)
                                      setNewTagName('')
                                    }}
                                    className="px-2 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  Used in {usage} recipe{usage !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tag Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(TAG_TAXONOMY).map(([category, tags]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{tags.length}</div>
                <div className="text-sm text-gray-500">{getCategoryDisplayName(category)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
