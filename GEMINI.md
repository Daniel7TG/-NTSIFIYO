# Mazahua Connect - Project Context

## Project Overview
**Mazahua Connect** is an educational web platform designed to facilitate the learning of the Mazahua language through interactive games and gamification. The application provides separate experiences for **Teachers** (who create and manage activities) and **Students** (who play games like Memory and Quizzes to earn XP and learn vocabulary).

## Technology Stack
- **Frontend:** React (v18.2) with React Router (v6)
- **State/Data Fetching:** `@tanstack/react-query`
- **Styling:** Tailwind CSS (Note: The `README.md` mentions Vanilla CSS, but the source code actively uses Tailwind directives like `@tailwind base;`). Material Symbols are used for icons, and Google Fonts (`Poppins`, `Public Sans`) for typography.
- **Backend:** Node.js, Express, MySQL, JWT authentication (Note: The `server/` directory mentioned in the `README.md` is not currently present in the root of the repository).

## Directory Structure
- `client/`: Contains the main React application source code, assets, and configuration.
  - `src/components/`: Reusable UI components organized by domain (Auth, Dashboard, Dictionary, Games, Teacher, etc.).
  - `src/context/`: React context providers for global state (Auth, Game, Student/Teacher Data).
  - `src/hooks/`: Custom React hooks, heavily utilizing `react-query` for API data fetching and caching.
  - `src/pages/`: Main route components and views.
  - `src/services/`: API client services (Activity, Auth, Dictionary, etc.).
- `docs/`: Project documentation, including DTO references and Use Case flow diagrams (`.txt` files).
- `imagesScript.py`: Python script, likely used for batch processing or resizing image assets.
- `cliente_clase/`: An alternative, older, or class-based version of the client.

## Building and Running
### Frontend
```bash
cd client
npm install
npm start
```
*Note: The frontend will start on `http://localhost:3000`.*

### Backend
*(As documented in `README.md`, but the folder is missing in the current tree)*
```bash
cd server
npm install
node server.js
```
*Requires a `.env` file in the `server/` directory with DB and JWT credentials.*

## Development Conventions
- **Roles:** The system enforces strict role separation between `Teacher` and `Student` via protected routes and dedicated dashboards.
- **Styling:** Uses Tailwind CSS for utility-first styling. The color palette emphasizes primary orange (`#E65100`), primary blue (`#1E3A8A`), and a green-to-yellow background gradient.
- **Icons & Typography:** Uses `@fontsource-variable/material-symbols-outlined` for scalable icons and `@fontsource` packages for local typography.
- **Data Fetching:** Standardized on `@tanstack/react-query` for server state management (see `src/hooks/`).