/**
 * HA Better Guest - Configuration Template
 *
 * Copy this file to 'ha-better-guest-config.js' in the same directory
 * and customize as needed. HACS will not overwrite your config file.
 *
 * After creating the config file, add it as a Lovelace resource BEFORE
 * the main ha-better-guest.js file:
 *   /hacsfiles/HABetterGuest/ha-better-guest-config.js
 */

window.haBetterGuestConfig = {
  // Default settings for all non-admin users
  default: {
    // Panels to hide from sidebar
    hiddenPanels: [
      'lovelace',        // Default dashboard
      'energy',          // Energy
      'map',             // Map
      'logbook',         // Logbook
      'history',         // History
      'developer-tools', // Developer Tools
      'config',          // Settings
      'media-browser',   // Media
      'todo'             // To-do lists
    ],
    // Where to redirect when accessing hidden panels
    redirectTo: '/profile'
  },

  // Per-user overrides (optional)
  // Use the exact username (case-sensitive) as the key
  users: {
    // Example: Less restrictive settings for user 'nikky'
    // 'nikky': {
    //   hiddenPanels: ['config', 'developer-tools'],
    //   redirectTo: '/lovelace-home'
    // },

    // Example: More restrictive settings for user 'guest'
    // 'guest': {
    //   hiddenPanels: ['lovelace', 'energy', 'map', 'logbook', 'history', 'developer-tools', 'config', 'media-browser', 'todo'],
    //   redirectTo: '/dashboard-public'
    // }
  }
};
