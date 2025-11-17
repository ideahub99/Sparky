# Sparky - AI-Powered Image Transformation App

Transform your photos with AI-powered tools. Built with React, TypeScript, Supabase, and Gemini AI.

## 🚀 Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Run development server**
```bash
npm run dev
```

## 📚 Documentation

All documentation has been moved to the `/docs` folder:

### Setup Guides
- **[QUICK_SETUP.md](./docs/QUICK_SETUP.md)** - Fast setup checklist
- **[IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md)** - Complete technical guide
- **[FEATURES_SUMMARY.md](./docs/FEATURES_SUMMARY.md)** - Overview of all features

### Payment Integration
- **[DODOPAY_SETUP.md](./docs/DODOPAY_SETUP.md)** - Quick DodoPay setup (3 steps)
- **[DODOPAY_INTEGRATION.md](./docs/DODOPAY_INTEGRATION.md)** - Complete DodoPay guide

### Backend & Database
- **[db_setup.md](./docs/db_setup.md)** - Database setup instructions
- **[backend.md](./docs/backend.md)** - Backend architecture
- **[edge_functions.md](./docs/edge_functions.md)** - Edge functions (legacy)
- **[EDGE_FUNCTIONS_MIGRATION.md](./docs/EDGE_FUNCTIONS_MIGRATION.md)** - Migration to services

### Fixes & Troubleshooting
- **[supabase_auth_fix.md](./docs/supabase_auth_fix.md)** - Authentication fixes
- **[user_profile_fix.md](./docs/user_profile_fix.md)** - User profile fixes
- **[db_trigger_fix.md](./docs/db_trigger_fix.md)** - Database trigger fixes
- **[rls_policy_fix.sql](./docs/rls_policy_fix.sql)** - RLS policy fixes

## 🎯 Key Features

- **AI Image Transformations**: Hairstyle, age, smile, and more
- **Facial Analysis**: Detailed AI-powered face analysis
- **Payment Integration**: DodoPay payment system
- **Smart Notifications**: Real-time user notifications
- **Theme Persistence**: Save your theme and color preferences
- **History Gallery**: View and download all generations

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Google Gemini AI
- **Payments**: DodoPay
- **Styling**: Tailwind CSS

## 📦 Project Structure

```
/components     - Reusable UI components
/pages          - Main page components
/services       - API services (Gemini, DodoPay, Notifications)
/hooks          - Custom React hooks
/lib            - Utilities and helpers
/constants      - App constants and configs
/i18n           - Internationalization
/docs           - All documentation
/supabase       - Supabase config and migrations
```

## 🔑 Required Environment Variables

```env
VITE_GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
VITE_DODOPAY_API_KEY=your_dodopay_key
```

See `.env.example` for detailed configuration.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the documentation in `/docs` first.

---

For detailed setup and usage instructions, see the documentation in the `/docs` folder.
