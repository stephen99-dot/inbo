# Inbo — AI Email Assistant Portal

Customer portal for Inbo. Built with React + Node.js/Express + SQLite. Deployed on Render.

## Tech Stack
- **Frontend:** React 18 + React Router
- **Backend:** Express.js REST API
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt
- **Fonts:** Syne + DM Sans

## Pages
- `/login` & `/register` — Authentication
- `/dashboard` — Overview stats + recent emails
- `/inbox` — Email list with category filters + detail view with AI draft panel
- `/drafts` — All pending AI-drafted replies
- `/settings` — Profile, integrations (Gmail/Outlook OAuth), AI preferences
- `/billing` — Plan management (Starter £12, Professional £22, Team £16/user)
- `/admin` — User management (admin only)

## Render Deployment

### Build Command
```
npm install && npm run build
```

### Start Command
```
node server/index.js
```

### Environment Variables
| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5001` |
| `JWT_SECRET` | Any random secret string |
| `ADMIN_EMAIL` | `hello@crmwizardai.com` |

### Optional (for email notifications)
| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_EMAIL` | `hello@crmwizardai.com` |
| `SMTP_PASSWORD` | Your app password |

### Optional (for Gmail OAuth)
| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | `https://your-app.onrender.com/api/auth/gmail/callback` |

### Optional (for Outlook OAuth)
| Variable | Value |
|---|---|
| `MICROSOFT_CLIENT_ID` | From Azure App Registration |
| `MICROSOFT_CLIENT_SECRET` | From Azure App Registration |
| `MICROSOFT_REDIRECT_URI` | `https://your-app.onrender.com/api/auth/outlook/callback` |

## Admin Access
The account registered with `ADMIN_EMAIL` automatically gets admin role and can access `/admin`.

## Local Development
```bash
npm install
# In terminal 1:
npm run dev:server
# In terminal 2:
npm run dev:client
```
App will be at `http://localhost:3000`, API at `http://localhost:5001`.
