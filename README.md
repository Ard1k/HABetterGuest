# HA Better Guest

HACS frontend plugin for Home Assistant that hides built-in panels for non-admin (guest) users.

## Features

- Hides system panels from the sidebar for non-admin users
- Redirects direct URL access to hidden panels to `/profile`
- Allows custom dashboards (lovelace-*) to remain visible
- No impact on admin users

## Hidden Panels

The following built-in panels are hidden for non-admin users:

- Overview (lovelace)
- Energy
- Map
- Logbook
- History
- Developer Tools
- Settings (config)

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Click on "Frontend"
3. Click the three dots menu in the top right
4. Select "Custom repositories"
5. Add this repository URL with category "Lovelace"
6. Click "Add"
7. Find "HA Better Guest" in the list and click "Download"
8. Add the resource to your Lovelace configuration (see below)

### Manual Installation

1. Download `ha-better-guest.js` from this repository
2. Copy it to your `config/www/` directory
3. Add the resource to your Lovelace configuration

## Configuration

Add the following to your Lovelace resources:

### Via UI

1. Go to Settings > Dashboards
2. Click the three dots menu in the top right
3. Select "Resources"
4. Click "Add Resource"
5. Enter URL: `/hacsfiles/ha-better-guest/ha-better-guest.js`
6. Select "JavaScript Module"
7. Click "Create"

### Via YAML

```yaml
lovelace:
  mode: yaml
  resources:
    - url: /hacsfiles/ha-better-guest/ha-better-guest.js
      type: module
```

## How It Works

1. The plugin waits for the Home Assistant frontend to load
2. It checks if the current user is an admin via `hass.user.is_admin`
3. For non-admin users:
   - A MutationObserver watches the sidebar and hides built-in panel links
   - Navigation listeners redirect any attempts to access hidden panels to `/profile`
4. Admin users see everything normally without any restrictions

## Guest User Visibility

After installation, non-admin (guest) users will only see:

- Custom dashboards (any dashboard with a name like `lovelace-something`)
- Profile page
- Any other custom panels you've added

## License

MIT
