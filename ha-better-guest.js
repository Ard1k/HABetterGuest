/**
 * HA Better Guest
 * HACS frontend plugin to hide built-in panels for non-admin users
 */

(function() {
  'use strict';

  // Default configuration (used if no config file is present)
  const DEFAULT_CONFIG = {
    default: {
      hiddenPanels: ['lovelace', 'energy', 'map', 'logbook', 'history', 'developer-tools', 'config', 'media-browser', 'todo'],
      redirectTo: '/profile'
    },
    users: {}
  };

  let config = null;
  let userConfig = null;
  let hass = null;
  let initialized = false;

  /**
   * Load configuration (async - tries to fetch config file from same directory)
   */
  async function loadConfig() {
    // Check if user has already defined custom config via separate resource
    if (window.haBetterGuestConfig) {
      config = window.haBetterGuestConfig;
      console.log('HA Better Guest: Using custom configuration (from window)');
      return;
    }

    // Get config URL relative to this script
    const scriptUrl = import.meta.url;
    const configUrl = scriptUrl.replace('ha-better-guest.js', 'ha-better-guest-config.js');

    try {
      const response = await fetch(configUrl, { method: 'HEAD' });
      if (response.ok) {
        // Config file exists, load it
        await import(configUrl);
        if (window.haBetterGuestConfig) {
          config = window.haBetterGuestConfig;
          console.log('HA Better Guest: Using custom configuration');
          return;
        }
      }
    } catch (e) {
      // Config file doesn't exist or can't be loaded
    }

    // No config found, use defaults
    config = DEFAULT_CONFIG;
    console.log('HA Better Guest: Using default configuration');
  }

  /**
   * Get configuration for current user
   */
  function getUserConfig(username) {
    if (!config) loadConfig();

    // Check if there's a specific config for this user
    if (config.users && config.users[username]) {
      console.log(`HA Better Guest: Using config for user '${username}'`);
      return config.users[username];
    }

    // Fall back to default config
    return config.default;
  }

  /**
   * Get the hass object from the DOM
   */
  function getHass() {
    const haMain = document.querySelector('home-assistant');
    if (haMain && haMain.hass) {
      return haMain.hass;
    }
    return null;
  }

  /**
   * Check if a panel path should be hidden
   */
  function shouldHidePanel(panelPath) {
    if (!userConfig) return false;
    return userConfig.hiddenPanels.includes(panelPath);
  }

  /**
   * Check if current URL path should be redirected
   */
  function shouldRedirectPath(path) {
    // Remove leading slash and get first segment
    const cleanPath = path.replace(/^\//, '').split('/')[0];
    return shouldHidePanel(cleanPath);
  }

  /**
   * Get redirect target
   */
  function getRedirectTo() {
    return userConfig ? userConfig.redirectTo : '/profile';
  }

  /**
   * Get sidebar element by traversing shadow DOM
   */
  function getSidebar() {
    try {
      const ha = document.querySelector('home-assistant');
      if (!ha || !ha.shadowRoot) return null;

      const main = ha.shadowRoot.querySelector('home-assistant-main');
      if (!main || !main.shadowRoot) return null;

      // Try different possible locations
      const sidebar = main.shadowRoot.querySelector('ha-sidebar') ||
                      main.shadowRoot.querySelector('ha-drawer')?.querySelector('ha-sidebar');

      return sidebar;
    } catch (e) {
      console.error('HA Better Guest: Error finding sidebar', e);
      return null;
    }
  }

  /**
   * Hide sidebar items for non-admin users
   */
  function hideSidebarItems() {
    const sidebar = getSidebar();
    if (!sidebar || !sidebar.shadowRoot) return;

    // Find all ha-md-list-item elements in the shadow root
    const items = sidebar.shadowRoot.querySelectorAll('ha-md-list-item');

    items.forEach(item => {
      // Use .href property (not attribute)
      const href = item.href;
      if (href) {
        // Extract panel name from href (e.g., "/energy" -> "energy")
        const panelPath = href.replace(/^\//, '').split('/')[0];

        if (shouldHidePanel(panelPath)) {
          item.style.display = 'none';
        }
      }
    });
  }

  /**
   * Redirect if on a hidden panel URL
   */
  function checkAndRedirect() {
    if (shouldRedirectPath(window.location.pathname)) {
      const redirectTo = getRedirectTo();
      window.history.replaceState(null, '', redirectTo);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  /**
   * Set up MutationObserver on sidebar
   */
  function observeSidebar() {
    const sidebar = getSidebar();
    if (!sidebar) {
      return;
    }

    // Initial hide
    hideSidebarItems();

    // Observe for changes
    const observer = new MutationObserver(() => {
      hideSidebarItems();
    });

    observer.observe(sidebar, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Also observe shadow root if available
    if (sidebar.shadowRoot) {
      observer.observe(sidebar.shadowRoot, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }

  /**
   * Set up navigation listeners
   */
  function setupNavigationListeners() {
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(checkAndRedirect, 0);
    });

    // Intercept pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(checkAndRedirect, 0);
    };

    history.replaceState = function(...args) {
      // Avoid infinite loop - only intercept if not already redirecting to profile
      if (args[2] !== REDIRECT_TO) {
        originalReplaceState.apply(this, args);
        setTimeout(checkAndRedirect, 0);
      } else {
        originalReplaceState.apply(this, args);
      }
    };

    // Initial check
    checkAndRedirect();
  }

  /**
   * Wait for sidebar to be available and set up observer
   */
  function waitForSidebar() {
    const sidebar = getSidebar();
    if (sidebar && sidebar.shadowRoot) {
      console.log('HA Better Guest: Sidebar found, setting up observer');
      observeSidebar();
      // Periodic re-check to handle dynamic updates
      setInterval(hideSidebarItems, 1000);
    } else {
      // Wait and retry
      setTimeout(waitForSidebar, 100);
    }
  }

  /**
   * Initialize the plugin
   */
  async function init() {
    if (initialized) {
      return;
    }

    hass = getHass();
    if (!hass || !hass.user) {
      // Retry until hass is available
      setTimeout(init, 100);
      return;
    }

    // Only apply restrictions for non-admin users
    if (hass.user.is_admin) {
      console.log('HA Better Guest: Admin user detected, no restrictions applied');
      initialized = true;
      return;
    }

    // Load configuration for this user
    await loadConfig();
    userConfig = getUserConfig(hass.user.name);
    console.log('HA Better Guest: Non-admin user detected, applying restrictions');
    console.log('HA Better Guest: Hidden panels:', userConfig.hiddenPanels);
    console.log('HA Better Guest: Redirect to:', userConfig.redirectTo);
    initialized = true;

    // Set up sidebar hiding
    waitForSidebar();

    // Set up navigation redirect
    setupNavigationListeners();
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also try to initialize on window load (backup)
  window.addEventListener('load', init);

})();
