# Overview

Padakkalam: Shadow Pixel Fight is a quirky 1v1 shadow fighting game featuring college students Jithin and Renjith. The game combines pixel art aesthetics with humor-filled Malayalam phrases and college-themed special attacks. Players control Jithin against an AI-controlled Renjith in a 2D fighting environment with health bars, combo systems, special abilities, and lifeline mechanics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses a React-based frontend with TypeScript, built on Vite for development and bundling. The UI is styled with Tailwind CSS and uses Radix UI components for consistent design patterns. The game engine is implemented using HTML5 Canvas with a modular architecture consisting of separate managers for different concerns.

### Game Engine Design
The core game logic is organized into specialized classes:
- **GameEngine**: Central coordinator managing game state and orchestrating all systems
- **Character**: Entity representing player and AI fighters with properties and behaviors
- **Renderer**: Handles all canvas drawing operations and visual effects
- **InputManager**: Processes keyboard and touch inputs for controls
- **AudioManager**: Manages background music and sound effects
- **AssetManager**: Loads and caches game images and resources
- **AI**: Controls enemy behavior patterns and special attacks

### State Management
Game state is managed through Zustand stores, providing reactive state updates between the game engine and React components. The fighting game store tracks health, combos, special modes, and lifeline availability.

### Mobile Support
The application includes responsive design with dedicated mobile controls featuring virtual joystick and attack buttons. Touch input is handled separately from keyboard input to provide optimal experience across devices.

## Backend Architecture
The backend uses Express.js with TypeScript in ESM format. The server structure includes:
- **Route Management**: Modular route registration system with API prefix
- **Storage Interface**: Abstracted storage layer supporting both in-memory and database implementations
- **Development Integration**: Vite middleware integration for hot module replacement

### Database Layer
Drizzle ORM is configured for PostgreSQL with schema definitions in TypeScript. The current schema includes basic user management with extensible structure for game statistics and leaderboards.

## External Dependencies

### Database
- **Neon Database**: PostgreSQL-compatible serverless database
- **Drizzle ORM**: Type-safe database operations with migration support

### UI Framework
- **Radix UI**: Accessible component primitives for modals, dropdowns, and form elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for UI elements

### Game Development
- **HTML5 Canvas**: 2D rendering context for game graphics
- **Web Audio API**: Sound effects and background music management

### Development Tools
- **Vite**: Build tool with hot module replacement
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds

### Deployment
- **Express.js**: Production server with static file serving
- **PostCSS**: CSS processing with autoprefixer support

The architecture prioritizes modularity and maintainability, with clear separation between game logic, rendering, and UI components. Asset management is designed for easy replacement of character sprites and sound effects.