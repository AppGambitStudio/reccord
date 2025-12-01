# Common Instructions & Best Practices

This document outlines the standard procedures and best practices for developing the Post Scheduler application.

## Database Management (SQLite & Sequelize)

### Schema Changes
When modifying the database schema (adding columns, changing types, etc.) in `backend/src/db.ts`:

1.  **Automatic Sync Limitations**: While `sequelize.sync({ alter: true })` is used in `initDB`, it may not always reliably update the SQLite database schema, especially for complex changes or when `ts-node` execution has environment issues.

2.  **Verification**: Always verify that the database schema has actually changed after restarting the backend. You can use the `sqlite3` CLI:
    ```bash
    # Check columns in a table
    sqlite3 backend/dev.db "PRAGMA table_info(TableName);"
    ```

3.  **Manual Migration (Standard Procedure)**:
    If the automatic sync fails or for production-readiness, we use SQL migration files.

    *   **Location**: `backend/migrations/`
    *   **Naming Convention**: `YYYYMMDD_HHMMSS_description.sql` (e.g., `20251127_220000_add_twitter_support.sql`)
    *   **Process**:
        1.  Create a new `.sql` file in `backend/migrations/`.
        2.  Write the SQL commands (one per line or semi-colon separated).
        3.  Apply the migration using `sqlite3`:
            ```bash
            sqlite3 backend/dev.db < backend/migrations/YOUR_MIGRATION_FILE.sql
            ```

    *   **Example Content**:
        ```sql
        -- Migration: Add Twitter Support
        ALTER TABLE Settings ADD COLUMN twitterClientId TEXT;
        ALTER TABLE posts ADD COLUMN platforms TEXT DEFAULT '["LINKEDIN"]';
        ```

### Debugging Database Issues
If data persistence seems broken (e.g., settings not saving):
1.  **Check Schema**: Check if the columns exist in the database using `PRAGMA table_info`.
2.  **Check Data**: Check if the data is actually being written using `SELECT * FROM TableName;`.
3.  **Permissions**: Ensure the backend process has write permissions to `dev.db`.

---

## Backend Development (Node.js & Express)

### Structure
*   **Routes**: Define API endpoints in `backend/src/routes/`.
*   **Services**: Encapsulate business logic and external API interactions (e.g., LinkedIn, Twitter, AI) in `backend/src/services/`.
*   **Models**: Define database models in `backend/src/db.ts`.

### Adding a New Feature
1.  **Service**: Create a new service file in `src/services/` if the feature involves complex logic or external APIs.
2.  **Route**: Create a new route file in `src/routes/` or add to an existing one.
3.  **Registration**: Register the new route in `backend/src/index.ts`.
    ```typescript
    import newRoute from './routes/newRoute';
    app.use('/api/new-feature', newRoute);
    ```

### Environment Variables
*   Store secrets (API keys, tokens) in `.env`.
*   Access them via `process.env.VARIABLE_NAME`.
*   **Important**: For `ts-node` execution, ensure `dotenv.config()` is called early. When accessing `process.env` in top-level code (outside functions), be cautious of `undefined` values.

---

## Frontend Development (Next.js & React)

### UI Components
*   **Library**: Use `shadcn/ui` components located in `frontend/src/components/ui/`.
*   **Icons**: Use `lucide-react` for all icons.
*   **Styling**: Use Tailwind CSS for styling. Avoid custom CSS classes unless necessary.

### State Management & API
*   **API Client**: Use the pre-configured axios instance in `frontend/src/lib/api.ts` for all backend requests. It handles the base URL automatically.
    ```typescript
    import api from "@/lib/api";
    const response = await api.get("/posts");
    ```
*   **Notifications**: Use `react-hot-toast` for success/error messages.
    ```typescript
    import toast from "react-hot-toast";
    toast.success("Operation successful");
    toast.error("Something went wrong");
    ```

### Adding a New Page
1.  Create a new directory in `frontend/src/app/` (e.g., `frontend/src/app/my-page/`).
2.  Add a `page.tsx` file.
3.  Mark it as `"use client"` if it uses React hooks (useState, useEffect).

### Modifying Global Styles
*   Global styles are in `frontend/src/app/globals.css`.
*   Theme variables (colors, radius) are defined here.

### Non-auth Warning
*   This is a non-auth application, so always display a warning banner at the top of the page.
    *   **Implementation**: This is handled in `frontend/src/app/layout.tsx`.
*   Make sure all the credentials and keys are part of the Settings table in the database.

### 6. Quality Assurance & Regression Testing
- **Check Existing Features**: When adding new features, ALWAYS verify that existing functionality (especially navigation, core flows, and layout) remains intact.
- **Sidebar & Navigation**: If modifying the sidebar or navigation menu, ensure no existing links are accidentally removed or overwritten.
- **Linting**: Address linting errors immediately. Do not let them accumulate.

## Version Management
*   Use semantic versioning (e.g., `1.0.0`, `1.0.1`, `1.1.0`).
    *   **Major (X.0.0)**: Significant new features or breaking changes (e.g., Idea Board, Twitter Support).
    *   **Minor (0.X.0)**: New functionality in a backward-compatible manner.
    *   **Patch (0.0.X)**: Backward-compatible bug fixes.
*   Update version in `backend/package.json` and `frontend/package.json`.
*   **Display**: The version is automatically read from `package.json` and displayed in the Sidebar (`frontend/src/components/Sidebar.tsx`).

## README.md
*   Please describe the aplication structure and setup details in the README.md file.
*   Update the README.md file with any new features or changes.
