# Up Only MCP Server

Connect your AI agent to [Up Only](https://uponly.arenatwo.com) — the free-to-play football prediction game.

Predict match outcomes, check leaderboards, and manage your gameweek — all through natural language with Claude, Cursor, or any MCP-compatible AI client.

## Quick Start

### Claude Desktop / VS Code / Cursor

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

That's it. No API keys, no secrets — just your Up Only account.

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

## Getting Started

Once connected, just talk to your AI agent:

1. **Sign in** — "Log in to Up Only with my email" (or create an account with "Sign me up")
2. **See matches** — "What matches are coming up this week?"
3. **Make predictions** — "Predict Arsenal to win 2-1"
4. **Lock in** — "Lock all my predictions for this gameweek"
5. **Check standings** — "Where am I on the leaderboard?"

Don't have an account? You can sign up directly through the MCP — just provide an email and password.

## Available Tools

### Auth
| Tool | Description |
|------|-------------|
| `auth_login_email` | Sign in with email and password |
| `auth_signup_email` | Create a new account |
| `auth_whoami` | Show current user |
| `auth_logout` | Sign out |

### Predictions (requires auth)
| Tool | Description |
|------|-------------|
| `submit_prediction` | Predict a match outcome and score |
| `lock_prediction` | Lock a single prediction (no more changes) |
| `lock_all_predictions` | Lock all predictions for a gameweek |
| `get_prediction` | Get your prediction for a specific fixture |
| `get_user_predictions` | Get all your predictions |

### Leaderboards
| Tool | Description |
|------|-------------|
| `get_weekly_leaderboard` | Gameweek standings |
| `get_overall_leaderboard` | Season standings |
| `get_my_leaderboard_position` | Your rank (requires auth) |
| `get_my_score` | Your points breakdown (requires auth) |
| `get_my_gameweek_status` | Lock status for a gameweek (requires auth) |

### Matches & Gameweeks
| Tool | Description |
|------|-------------|
| `get_current_gameweek` | Current active gameweek with all matches |
| `get_gameweeks` | List all gameweeks |
| `get_gameweek` | Single gameweek with match details |
| `get_leagues` | All available leagues |
| `get_upcoming_matches` | Upcoming fixtures for a league |
| `get_past_matches` | Past results for a league |

### Info
| Tool | Description |
|------|-------------|
| `get_uponly_info` | Game rules, scoring system, and league info |

## Scoring

- **+2 points** for predicting the correct match outcome (home win, away win, or draw)
- **+3 bonus points** for predicting the exact score

Predict all matches each gameweek to maximize your score and climb the leaderboard.

## How It Works

This MCP server uses the Firebase Client SDK with the same public configuration as the Up Only web app. All operations go through Firestore security rules — you can only read and write your own data.

No API keys or secrets are needed beyond your Up Only account credentials.

## Links

- [Play Up Only](https://uponly.arenatwo.com)
- [Arena Two](https://arenatwo.com)
- [Report an issue](https://github.com/arenatwo/uponly-mcp/issues)
