# Up Only MCP Server

Connect your AI agent to [Up Only](https://uponly.arenatwo.com) — the free-to-play football prediction game.

## Quick Start

### Claude Desktop / VS Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "uponly": {
      "command": "npx",
      "args": ["@arenatwo/uponly-mcp"]
    }
  }
}
```

### From Source

```bash
git clone https://github.com/arenatwo/uponly-mcp.git
cd uponly-mcp
npm install
npm run build
```

Then add to your MCP config:

```json
{
  "mcpServers": {
    "uponly": {
      "command": "node",
      "args": ["/path/to/uponly-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### Auth
- `auth_login_email` — Sign in with email/password
- `auth_signup_email` — Create a new account
- `auth_whoami` — Show current user
- `auth_logout` — Sign out

### Predictions (requires auth)
- `submit_prediction` — Predict a match outcome and score
- `lock_prediction` — Lock a prediction (no more changes)
- `lock_all_predictions` — Lock all predictions for a gameweek
- `get_prediction` — Get your prediction for a fixture
- `get_user_predictions` — Get all your predictions

### Leaderboards
- `get_weekly_leaderboard` — Gameweek standings
- `get_overall_leaderboard` — Season standings
- `get_my_leaderboard_position` — Your rank (requires auth)
- `get_my_score` — Your points breakdown (requires auth)
- `get_my_gameweek_status` — Lock status (requires auth)

### Matches & Gameweeks
- `get_current_gameweek` — Current active gameweek with matches
- `get_gameweeks` — List all gameweeks
- `get_gameweek` — Single gameweek details
- `get_leagues` — All leagues
- `get_upcoming_matches` — Upcoming fixtures for a league
- `get_past_matches` — Past fixtures for a league

### Info
- `get_uponly_info` — Rules, scoring system, and leagues

## How It Works

This MCP server uses the Firebase Client SDK with the same public configuration as the Up Only web app. All operations go through Firestore security rules — you can only read/write your own data.

No API keys or secrets are needed beyond your Up Only account credentials.
