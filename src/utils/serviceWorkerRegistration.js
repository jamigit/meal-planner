/**
 * @fileoverview Service Worker Registration for PWA functionality
 * 
 * Handles service worker registration, updates, and lifecycle management
 * for the Progressive Web App features.
 */

import { Workbox } from 'workbox-window'

let wb

export function register() {
  if ('serviceWorker' in navigator) {
    wb = new Workbox('/sw.js')

    wb.addEventListener('controlling', () => {
      // Service worker is controlling the page
      console.log('Service worker is now controlling the page')
    })

    wb.addEventListener('waiting', () => {
      // New service worker is waiting to activate
      console.log('New service worker is waiting to activate')
      
      // Show update notification to user
      if (confirm('New version available! Reload to update?')) {
        wb.messageSkipWaiting()
        window.location.reload()
      }
    })

    wb.addEventListener('activated', (event) => {
      // Service worker has been activated
      if (!event.isUpdate) {
        console.log('Service worker activated for the first time')
      } else {
        console.log('Service worker updated and activated')
      }
    })

    wb.addEventListener('message', (event) => {
      // Handle messages from service worker
      if (event.data && event.data.type === 'SKIP_WAITING') {
        window.location.reload()
      }
    })

    // Register the service worker
    wb.register().then((registration) => {
      console.log('Service worker registered:', registration)
    }).catch((error) => {
      console.error('Service worker registration failed:', error)
    })
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
        console.log('Service worker unregistered')
      })
      .catch((error) => {
        console.error('Service worker unregistration failed:', error)
      })
  }
}

// Check for updates manually
export function checkForUpdates() {
  if (wb) {
    wb.update()
  }
}

// Skip waiting for new service worker
export function skipWaiting() {
  if (wb) {
    wb.messageSkipWaiting()
  }
}
