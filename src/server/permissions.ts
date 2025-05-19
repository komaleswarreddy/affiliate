/**
 * Route permissions mapping
 * 
 * This file defines which permissions are required to access specific API routes.
 * Format: { '/api/route-prefix': ['permission1', 'permission2'] }
 */

// Define route permissions for the application
export const routePermissions: Record<string, string[]> = {
  '/api/affiliates': ['affiliates:read'],
  '/api/affiliates/create': ['affiliates:create'],
  '/api/affiliates/update': ['affiliates:update'],
  '/api/affiliates/delete': ['affiliates:delete'],
  
  '/api/campaigns': ['campaigns:read'],
  '/api/campaigns/create': ['campaigns:create'],
  '/api/campaigns/update': ['campaigns:update'],
  '/api/campaigns/delete': ['campaigns:delete'],
  
  '/api/commissions': ['commissions:read'],
  '/api/commissions/create': ['commissions:create'],
  '/api/commissions/update': ['commissions:update'],
  '/api/commissions/delete': ['commissions:delete'],

  '/api/reports': ['reports:read'],
  
  '/api/settings': ['settings:read'],
  '/api/settings/update': ['settings:update'],
  
  '/api/users': ['users:read'],
  '/api/users/create': ['users:create'],
  '/api/users/update': ['users:update'],
  '/api/users/delete': ['users:delete'],
  
  // Additional routes can be added as needed
  
  // Default public routes
  '/api/auth/login': [],
  '/api/auth/register': [],
  '/api/auth/forgot-password': [],
  '/api/auth/reset-password': [],
  '/api/auth/verify-token': [],
  '/api/health': []
}; 