/**
 * @fileoverview Mock Service Worker setup for testing
 * 
 * This file configures MSW to mock Supabase API calls during testing,
 * allowing us to test service layer logic without hitting real APIs.
 */

import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock Supabase API responses
export const handlers = [
  // Mock Supabase auth endpoints
  http.post('https://test.supabase.co/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
    })
  }),

  // Mock Supabase recipes endpoints
  http.get('https://test.supabase.co/rest/v1/recipes', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 'test-user-id',
        name: 'Test Recipe',
        url: 'https://example.com/recipe',
        ingredients: ['1 chicken breast'],
        instructions: ['Cook the chicken'],
        prep_time: 10,
        cook_time: 20,
        servings: 2,
        cuisine_tags: ['Italian'],
        ingredient_tags: ['Chicken'],
        convenience_tags: ['Quick'],
        tags: ['test'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.post('https://test.supabase.co/rest/v1/recipes', () => {
    return HttpResponse.json({
      id: 2,
      user_id: 'test-user-id',
      name: 'New Recipe',
      url: null,
      ingredients: [],
      instructions: [],
      prep_time: null,
      cook_time: null,
      servings: null,
      cuisine_tags: [],
      ingredient_tags: [],
      convenience_tags: [],
      tags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    })
  }),

  // Mock Supabase weekly_plans endpoints
  http.get('https://test.supabase.co/rest/v1/weekly_plans', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 'test-user-id',
        meals: [{
          id: 1,
          name: 'Test Recipe',
          url: 'https://example.com/recipe',
          ingredients: ['1 chicken breast'],
          instructions: ['Cook the chicken'],
          prep_time: 10,
          cook_time: 20,
          servings: 2,
          scaling: 1
        }],
        notes: 'Test plan notes',
        name: 'Test Plan',
        is_current: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.post('https://test.supabase.co/rest/v1/weekly_plans', () => {
    return HttpResponse.json({
      id: 2,
      user_id: 'test-user-id',
      meals: [],
      notes: '',
      name: null,
      is_current: true,
      created_at: '2024-01-01T00:00:00Z'
    })
  }),

  // Mock Supabase meal_history endpoints
  http.get('https://test.supabase.co/rest/v1/meal_history', () => {
    return HttpResponse.json([
      {
        id: 1,
        user_id: 'test-user-id',
        recipe_id: 1,
        week_date: '2024-01-01',
        eaten_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z'
      }
    ])
  }),

  http.post('https://test.supabase.co/rest/v1/meal_history', () => {
    return HttpResponse.json({
      id: 2,
      user_id: 'test-user-id',
      recipe_id: 1,
      week_date: '2024-01-01',
      eaten_date: '2024-01-01',
      created_at: '2024-01-01T00:00:00Z'
    })
  }),

  // Mock Claude API endpoint
  http.post('http://localhost:3002/api/claude', () => {
    return HttpResponse.json({
      suggestions: [
        {
          id: 'suggestion-1',
          meals: [
            { id: 1, name: 'Recipe 1', reasoning: 'Popular choice' },
            { id: 2, name: 'Recipe 2', reasoning: 'Good variety' },
            { id: 3, name: 'Recipe 3', reasoning: 'Quick meal' },
            { id: 4, name: 'Recipe 4', reasoning: 'Healthy option' }
          ],
          explanation: 'This selection balances your preferences with variety'
        }
      ]
    })
  })
]

// Create the MSW server
export const server = setupServer(...handlers)
