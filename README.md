# trusinski-fiszki

AI-powered flashcard creation and management application with spaced repetition learning system.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

trusinski-fiszki is an educational flashcard application that leverages AI to streamline the creation and management of flashcard sets. The platform addresses the time-consuming nature of manual flashcard creation by utilizing Large Language Models (LLMs) to generate high-quality question-answer pairs from user-provided text.

**Key Features:**

- 🤖 **AI-Powered Generation**: Automatically generate flashcards from any text using LLMs via OpenRouter.ai
- ✏️ **Manual Creation**: Create and edit flashcards manually with full control
- 🔐 **User Authentication**: Secure registration and login system powered by Supabase
- 📚 **Spaced Repetition**: Built-in learning sessions using proven spaced repetition algorithms
- 📊 **Statistics Tracking**: Monitor AI generation effectiveness and acceptance rates
- 🎯 **Privacy-First**: User flashcards remain private with GDPR-compliant data handling

## Tech Stack

### Frontend

- **Astro 5.13.7** - Meta-framework for fast, content-focused websites
- **React 19.1.1** - Interactive UI components
- **TypeScript 5** - Static type checking
- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **Shadcn/ui** - Accessible component library built on Radix UI
- **Lucide React** - Beautiful icon set

### Backend

- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - RESTful APIs

### AI Integration

- **OpenRouter.ai** - Access to multiple LLM providers (OpenAI, Anthropic, Google, etc.)

### Development Tools

- **ESLint 9** - Code linting
- **Prettier** - Code formatting
- **Husky + Lint-staged** - Pre-commit hooks for code quality
- **TypeScript ESLint** - TypeScript-specific linting rules

### CI/CD & Hosting

- **GitHub Actions** - Continuous integration and deployment
- **DigitalOcean** - Production hosting via Docker containers

## Getting Started Locally

### Prerequisites

- **Node.js**: 22.14.0 (use nvm: `nvm use`)
- **npm**: Comes with Node.js
- **Supabase Account**: Required for backend services

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd fiszki
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Create .env file with the following variables:
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# OPENROUTER_API_KEY=your_openrouter_api_key
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

## Available Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start development server with hot reload |
| `npm run build`    | Build production-ready application       |
| `npm run preview`  | Preview production build locally         |
| `npm run astro`    | Run Astro CLI commands                   |
| `npm run lint`     | Check code for linting errors            |
| `npm run lint:fix` | Automatically fix linting errors         |
| `npm run format`   | Format code with Prettier                |

## Project Scope

### ✅ In Scope (MVP)

- **AI Flashcard Generation**: Generate flashcards from text (1,000-10,000 characters)
- **Manual Flashcard Management**: Create, edit, and delete flashcards manually
- **User Authentication**: Registration, login, and account management
- **Spaced Repetition**: Learning sessions powered by external algorithm library
- **Privacy & Security**: GDPR-compliant data storage with user data deletion rights
- **Generation Statistics**: Track AI-generated vs. accepted flashcard ratios

### ❌ Out of Scope (MVP)

- Advanced custom spaced repetition algorithms
- Gamification features
- Mobile applications (web-only for MVP)
- Document import (PDF, DOCX formats)
- Public API
- Flashcard sharing between users
- Advanced notification system
- Full-text search across flashcards

## Project Status

🚧 **MVP in Development**

**Success Metrics:**

- 75% of AI-generated flashcards accepted by users
- 75% of all flashcards created using AI assistance
- User engagement tracking via generation and acceptance statistics

**Current Phase:** Initial development and feature implementation

## License

This project license is to be determined. Please contact the project maintainers for licensing information.

---

**Built with ❤️ by 10xDevs**
