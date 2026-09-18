# Environment Variables Setup

This document explains how to configure environment variables for the frontend application.

## Setup Instructions

1. **Copy the example file:**
   ```bash
   copy .env.example .env
   ```

2. **Update the `.env` file with your configuration:**
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```

## Available Environment Variables

### REACT_APP_API_URL
- **Description:** The base URL for the backend API
- **Default:** `http://localhost:8000/api`
- **Example:** `http://localhost:8000/api`
- **Note:** Must start with `REACT_APP_` to be accessible in React

## Different Environments

### Development (Local)
```env
REACT_APP_API_URL=http://localhost:8000/api
```

### Production
```env
REACT_APP_API_URL=https://your-production-domain.com/api
```

### Custom Port
If your backend runs on a different port:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Important Notes

1. **Restart Required:** After changing `.env` file, you must restart the development server:
   ```bash
   npm start
   ```

2. **Build Time Variables:** Environment variables are embedded into the build at compile time, not runtime. Rebuild when changing variables for production:
   ```bash
   npm run build
   ```

3. **Git Ignore:** The `.env` file is ignored by git to prevent committing sensitive data. Always use `.env.example` as a template.

4. **Variable Prefix:** All React environment variables must start with `REACT_APP_` or they won't be accessible.

## Troubleshooting

**Problem:** Environment variable not working

**Solution:** 
1. Verify the variable starts with `REACT_APP_`
2. Restart the development server
3. Check for syntax errors in `.env` file
4. Verify `.env` is in the correct directory (`frontend/.env`)

**Problem:** Getting "localhost:8000" in production

**Solution:** 
Make sure you've set `REACT_APP_API_URL` in your production environment and rebuilt the application.
