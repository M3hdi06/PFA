# AI Coding Instructions for MapSpot/PrepFA

## Project Overview
PrepFA is a geolocation-based social platform for discovering and sharing sports/leisure spots (football fields, skateparks, etc.) with interactive maps, community features, and user authentication. **The project is in early stages—backend and frontend architecture are incomplete.**

## Architecture

### Frontend (`/front`)
- **Framework**: React 19 with React Router v7 for SPA routing
- **Entry Point**: `src/index.js` wraps app in `BrowserRouter` context
- **Root Component**: `src/App.js` manages routes and layout with navbar (currently static placeholder)
- **Components Structure**: `/src/components/` organized by feature (each with `.jsx` + `.css`)
  - `Login.jsx`, `Inscription.jsx` (auth pages, form validation + state management)
  - `Navbar.jsx` (responsive hamburger menu, currently placeholder links)
  - `Home.jsx` (main landing page)

### Backend (`/back`)
- **Framework**: Express.js 5.x with nodemon for development
- **Current State**: Stub server (`server.js`) with placeholder test routes
- **Missing**: No models, controllers, middleware, routes structure yet—needs complete build-out
- **Expected**: MongoDB integration, JWT auth middleware, Express routing for `/api/auth/*` and `/api/spots/*`

### Frontend-Backend Communication
- Components post to API endpoints (e.g., `POST /api/auth/register` in Inscription.jsx)
- **No CORS/env config yet**—frontend expects relative URLs; must configure before production

## Key Patterns & Conventions

### React Component Patterns
1. **Controlled Forms**: Use `useState` for form state; update via `handleChange` with `[name]: value` pattern
2. **Form Validation**: Validate before submit; set errors object with field-specific messages (see Inscription.jsx lines 18-29)
3. **Loading States**: Use `isLoading` boolean during API calls to disable submit buttons
4. **Language**: All UI text is **French**; maintain this in all new components
5. **Navigation**: Use `useNavigate()` hook for programmatic routing; nav links in Navbar are static data arrays

### File Naming
- Components: **PascalCase** (.jsx) in feature folders with matching .css
- Files must be `.jsx` (not `.js`) for JSX content per existing convention

### CSS Organization
- **BEM-style classes** with `__` for elements and `--` for modifiers (see Navbar.css pattern)
- Inline styles avoided; all styling in separate .css files
- Mobile-first responsive (hamburger menu in Navbar example)

## Development Workflows

### Frontend Development
```bash
cd front
npm install  # Install dependencies
npm start    # Runs on http://localhost:3000 (react-scripts dev server)
npm build    # Production build
npm test     # Run Jest tests (currently minimal coverage)
```

### Backend Development
```bash
cd back
npm install
npm start    # Not configured yet—manually run `node server.js` or `npx nodemon server.js`
```

## Critical Setup Tasks (Before Feature Development)
1. **Backend structure**: Create `/back/routes`, `/back/controllers`, `/back/models` directories
2. **MongoDB connection**: Configure connection string in `.env` (not yet present)
3. **JWT auth**: Add middleware for token validation and protected routes
4. **CORS**: Enable Express CORS middleware for frontend requests
5. **API routes**: Implement `/api/auth/register`, `/api/auth/login`, `/api/spots/*` endpoints matching form submissions
6. **Multer**: Set up image upload handling for spot photos (referenced in README)

## Project Identity
- **Name**: PrepFA (or MapSpot in README—appears to be transitioning)
- **Target Users**: Students/learners managing revisions + community sharing leisure spots
- **Tone**: Modern, supportive, with emoji badges (`⚡ 🔒 📈`)

## Important Notes
- Form validation uses French error messages (e.g., "Le nom est requis")
- No environment file (`.env`) created yet—add before API integration
- Success state in Inscription clears form but doesn't navigate—confirm desired UX
- Backend has no database models or auth—coordinate API contract before frontend implementation

