# Voice CRM V2

Voice CRM V2 is a CRM application designed to help users manage customer relationships and support AI-powered assistance.

## Features

- User authentication with Supabase
- User-specific data protected by Row Level Security (RLS)
- AI assistant API integration
- Next.js application interface
- Supabase database integration

## Tech Stack

- Next.js
- TypeScript
- Supabase
- React
- Tailwind CSS
- OpenRouter (for AI model integration, when configured)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/bhaskar24barmo-stack/voice-crm.git
cd voice-crm
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root and copy the required variables from `.env.example`.

Fill in the appropriate values for your Supabase project and AI provider.

Never commit real API keys, passwords, or secrets to GitHub.

### 4. Set up Supabase

1. Open your Supabase project.
2. Go to the SQL Editor.
3. Run the SQL migration from `supabase/migrations/001_voice_crm.sql`.
4. Confirm that the required tables and Row Level Security policies are configured.

### 5. Run the application

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 6. Check the build

```bash
npm run typecheck
npm run build
```

Run these commands only if the corresponding scripts are defined in `package.json`.

## Deployment

Configure the required environment variables in your hosting provider, such as Vercel, and deploy the application.

After changing environment variables, redeploy if required.

## Current Limitations

The following features may require additional development:

- Teams and organizations
- Billing
- Calendar and email synchronization
- Delete and edit screens
- Automated tests
- Redis-based rate limiting
- Progressive Web App (PWA) and offline support

## Security

- Keep secrets in environment variables.
- Never expose service-role keys in client-side code.
- Use Supabase Row Level Security to protect user data.
- Validate and authorize requests on the server.

## License

Add your preferred license before distributing this project.
