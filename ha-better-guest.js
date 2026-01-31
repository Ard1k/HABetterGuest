/**
 * HA Better Guest
 * HACS frontend plugin to hide built-in panels for non-admin users
 */

(function() {
  'use strict';

  const HIDDEN_PANELS = ['lovelace', 'energy', 'map', 'logbook', 'history', 'developer-tools', 'config'];
  const REDIRECT_TO = '/profile';

  let hass = null;
  let initialized = false;
  let styleInjected = false;

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
    // Exact match for built-in panels
    if (HIDDEN_PANELS.includes(panelPath)) {
      return true;
    }
    return false;
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
   * Generate CSS to hide sidebar items
   */
  function generateHideCSS() {
    const selectors = HIDDEN_PANELS.map(panel => {
      return `a[href="/${panel}"], a[data-panel="${panel}"], paper-icon-item[data-panel="${panel}"]`;
    }).join(',\n');

    return `${selectors} { display: none !important; }`;
  }

  /**
   * Inject CSS into shadow root
   */
  function injectStyleIntoShadowRoot(shadowRoot) {
    if (!shadowRoot) return;

    // Check if style already injected
    if (shadowRoot.querySelector('#ha-better-guest-style')) return;

    const style = document.createElement('style');
    style.id = 'ha-better-guest-style';
    style.textContent = generateHideCSS();
    shadowRoot.appendChild(style);
  }

  /**
   * Hide sidebar items for non-admin users
   */
  function hideSidebarItems() {
    const sidebar = document.querySelector('ha-sidebar');
    if (!sidebar) return;

    // Method 1: Inject CSS into shadow root
    if (sidebar.shadowRoot) {
      injectStyleIntoShadowRoot(sidebar.shadowRoot);
    }

    // Method 2: Direct style manipulation as fallback
    const roots = [sidebar, sidebar.shadowRoot].filter(Boolean);

    roots.forEach(root => {
      // Try various selectors used in different HA versions
      const selectors = [
        'a[href]',
        'paper-icon-item[data-panel]',
        '.menu a',
        'paper-listbox a'
      ];

      selectors.forEach(selector => {
        try {
          const items = root.querySelectorAll(selector);
          items.forEach(item => {
            const href = item.getAttribute('href');
            const dataPanel = item.getAttribute('data-panel');
            const panelPath = dataPanel || (href ? href.replace(/^\//, '').split('/')[0] : null);

            if (panelPath && shouldHidePanel(panelPath)) {
              item.style.display = 'none';
            }
          });
        } catch (e) {
          // Selector not supported, continue
        }
      });
    });
  }

  /**
   * Redirect if on a hidden panel URL
   */
  function checkAndRedirect() {
    if (shouldRedirectPath(window.location.pathname)) {
      window.history.replaceState(null, '', REDIRECT_TO);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }

  /**
   * Set up MutationObserver on sidebar
   */
  function observeSidebar() {
    const sidebar = document.querySelector('ha-sidebar');
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
    const sidebar = document.querySelector('ha-sidebar');
    if (sidebar && sidebar.shadowRoot) {
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
  function init() {
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

    console.log('HA Better Guest: Non-admin user detected, applying restrictions');
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
