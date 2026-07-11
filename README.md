# AI Cooking To-Do List

A dynamic, full-stack AI-powered meal planner built with Vite, React, Express, and SQLite.

## Hackathon Links
- **GitHub Repository**: [https://github.com/ayusht9/AI-Cook](https://github.com/ayusht9/AI-Cook)
- **Deployed Link (Render - Full Backend)**: [https://ai-cook-rm5m.onrender.com/](https://ai-cook-rm5m.onrender.com/)
- **Deployed Link (GitHub Pages - Static Fallback)**: [https://ayusht9.github.io/AI-Cook/](https://ayusht9.github.io/AI-Cook/)

## Key Solution 🗝️
The core challenge was to build a robust, AI-powered meal planner that is highly personalized (schedule, budget, and dietary preferences) while remaining lightning-fast.

Our solution involves a robust **Full-Stack Architecture**:
- **Backend & Database**: An Express.js API powers the backend, seamlessly communicating with a real `better-sqlite3` SQLite database to persistently store user profiles and history.
- **AI Inference (GenAI Services)**: We utilized **Transformers.js** (`@xenova/transformers`) running in a Web Worker on the client to generate contextually aware notes, paired with a blazing-fast internal logic engine to structure the JSON results perfectly without waiting on slow LLM outputs.
- **Accessibility & UX**: We implemented a pure Vanilla CSS glassmorphic design system with a dark/light mode toggle and integrated the Web Speech API for reading plans aloud.

## Top 5 Features 🌟
1. **Dynamic Generation**: Caloric baselines and protein macros adjust automatically depending on whether your daily schedule is sedentary, moderate, or intense.
2. **Budget Feasibility (INR)**: Generates 3 tiered meal choices (Budget Saver, Standard, Premium) that actively calculate estimated grocery costs and warn you if a plan exceeds your budget.
3. **Instant "Fast Mode"**: Bypasses heavy local AI weight downloads to instantly generate plans using our fallback logic, ensuring a flawless user experience even on slow internet connections.
4. **Persistent History Tracking**: Every generated and selected plan is securely saved to your user profile in the SQLite database, allowing you to instantly view and **Regenerate** past meal plans.
5. **Accessibility-First Design**: Fully responsive across devices with support for 200% font scaling, ARIA labels, and a built-in Voice Reader that reads your grocery list out loud.

## Local Setup
1. Clone the repository.
2. Run `npm install`
3. Run `npm run build`
4. Run `npm start` (Starts the Express API and serves the production React build on `http://localhost:3000`)
5. For frontend development, run `npm run dev`

Enjoy your AI-generated meals!
