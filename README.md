# HA Better Guest

HACS frontend plugin for Home Assistant that hides built-in panels for non-admin (guest) users. Fully Vibecoded using Claude Opus 4.5

## Features

- Hides system panels from the sidebar for non-admin users
- Redirects direct URL access to hidden panels
- Configurable per-user settings
- Allows custom dashboards to remain visible
- No impact on admin users

## Installation

### HACS

Install using HACS - will start working after browser refresh

## Configuration (Optional)

Without configuration, the plugin uses default settings that hide most system panels and redirect to `/profile`.

### Custom Configuration

To customize the behavior:

1. Navigate to `/homeassistant/www/community/HABetterGuest/`
2. Copy `ha-better-guest-config.template.js` to `ha-better-guest-config.js`
3. Edit `ha-better-guest-config.js` to your needs

### Configuration Example

```javascript
window.haBetterGuestConfig = {
  // Default settings for all non-admin users
  default: {
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
    redirectTo: '/profile'
  },

  // Per-user overrides (optional)
  users: {
    // Less restrictive for user 'nikky'
    'nikky': {
      hiddenPanels: ['config', 'developer-tools'],
      redirectTo: '/lovelace-home'
    },

    // More restrictive for user 'guest'
    'guest': {
      hiddenPanels: ['lovelace', 'energy', 'map', 'logbook', 'history',
                     'developer-tools', 'config', 'media-browser', 'todo'],
      redirectTo: '/dashboard-public'
    }
  }
};
```

### Available Panel Names

| Panel Name | Description |
|------------|-------------|
| `lovelace` | Default Overview dashboard |
| `energy` | Energy dashboard |
| `map` | Map |
| `logbook` | Logbook |
| `history` | History |
| `developer-tools` | Developer Tools |
| `config` | Settings |
| `media-browser` | Media browser |
| `todo` | To-do lists |

Custom dashboards use their URL path, e.g., `dashboard-public` for `/dashboard-public`.

## How It Works

1. The plugin waits for the Home Assistant frontend to load
2. It checks if the current user is an admin via `hass.user.is_admin`
3. For non-admin users:
   - Loads configuration (custom or default)
   - Gets user-specific settings if defined
   - Hides configured panels from the sidebar
   - Redirects access to hidden panels to the configured URL
4. Admin users see everything normally without any restrictions

## Troubleshooting

Open browser console (F12) to see debug messages:
- `HA Better Guest: Using custom configuration` - config file loaded
- `HA Better Guest: Using default configuration` - no config file found
- `HA Better Guest: Using config for user 'username'` - per-user config active
- `HA Better Guest: Hidden panels: [...]` - list of hidden panels
- `HA Better Guest: Redirect to: ...` - redirect target

## License

MIT
