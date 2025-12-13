# The Pre-Post

**Think clearly before writing content.**

A production-ready web application that helps creators think through their ideas before jumping into writing. Built with React, Next.js, PostgreSQL (Neon), and OpenRouter AI.

## Philosophy

> "Creators waste energy deciding what to create, not how to write it."

Writing is the last step, not the first. The Pre-Post guides creators through a structured thinking process before they ever write a word.

## Features

### 1. Authentication
- Simple email/password login and signup
- Secure JWT-based session handling
- Clean, minimal UI

### 2. Idea Box (Raw Input Layer)
- Drop random thoughts, half ideas, voice-to-text notes
- No formatting enforcement
- No AI rewriting - stores raw input as-is

### 3. Idea Refiner (AI Thinking Layer)
- AI restates ideas clearly
- Generates 2-3 thinking questions
- Suggests content angles (opinion, story, teaching, contrarian)

### 4. Mind Map (Structured Thinking)
- Converts refined ideas into lightweight tree structures
- Core idea, supporting points, examples, CTA
- Fully editable by user

### 5. Content History (Memory Engine)
- Tracks past content with themes
- Detects repetition
- Flags overused themes
- Suggests missing perspectives

### 6. Content Planner (Decision Support)
- Platform-aware suggestions (LinkedIn, X, Blog)
- Best format recommendations
- Optimal posting day suggestions
- Hook style recommendations
- No scheduling or automation - just intelligence

### 7. Caption Draft (Final Step Only)
- Generates content only after planning
- Platform-aware formatting
- Short, clean, fully editable
- No emojis unless platform-appropriate

## Tech Stack

- **Frontend**: React 18, Next.js 14, Tailwind CSS
- **Backend**: Next.js API Routes (serverless-compatible)
- **Database**: Neon (PostgreSQL)
- **AI**: OpenRouter (Claude 3.5 Sonnet for reasoning, GPT-4 Turbo for writing)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Neon PostgreSQL database
- An OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd the-pre-post
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL`: Your Neon PostgreSQL connection string
- `JWT_SECRET`: A strong random string for JWT signing
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `NEXT_PUBLIC_APP_URL`: Your app URL (http://localhost:3000 for local)

4. Run database migrations:
```bash
# Connect to your Neon database and run:
psql $DATABASE_URL -f lib/migrations/001_initial_schema.sql
```

Or use the Neon dashboard SQL editor to run the migration file.

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
the-pre-post/
├── app/
│   ├── api/              # API routes (serverless)
│   │   ├── auth/         # Authentication endpoints
│   │   ├── ideas/        # Idea management
│   │   ├── mind-maps/    # Mind map operations
│   │   ├── content-history/  # History and analysis
│   │   ├── content-plans/    # Planning endpoints
│   │   └── drafts/       # Draft generation
│   ├── components/       # React components
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── contexts/             # React contexts (Auth)
├── lib/
│   ├── ai.ts             # AI service layer (OpenRouter)
│   ├── api.ts            # API client utilities
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts             # Database connection
│   ├── schema.ts         # Schema reference (Drizzle)
│   └── migrations/       # SQL migration files
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## AI Model Selection

The app uses different AI models for different tasks:

- **Reasoning & Planning**: `anthropic/claude-3.5-sonnet`
  - Strong reasoning capabilities
  - Excellent at structured thinking
  - Used for idea refinement, mind maps, content planning

- **Writing**: `openai/gpt-4-turbo`
  - High-quality writing output
  - Platform-aware content generation
  - Used only for final caption drafting

Model choices are documented in `lib/ai.ts` with brief explanations.

## Database Schema

The database uses PostgreSQL with the following main tables:

- `users`: User authentication and profiles
- `ideas`: Raw input from Idea Box
- `refined_ideas`: AI-refined ideas with questions and angles
- `mind_maps`: Structured thinking trees (JSON)
- `content_history`: Past content tracking
- `content_plans`: Decision support data
- `drafts`: Final caption drafts

See `lib/migrations/001_initial_schema.sql` for the full schema.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENROUTER_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
4. Deploy!

The app is fully serverless-compatible and works seamlessly on Vercel.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for OpenRouter referrer) | Yes |

## Code Philosophy

- **Modular**: Each feature is self-contained
- **Readable**: Clear naming and structure
- **Extensible**: Easy to add new features
- **Serverless-friendly**: All API routes work on Vercel
- **Type-safe**: Full TypeScript coverage

## Future Extensions

The codebase is designed to easily extend into:
- Multi-user collaboration
- Content scheduling
- Analytics and insights
- Export to various platforms
- Advanced AI features

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

