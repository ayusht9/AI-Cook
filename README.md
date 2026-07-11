# AI Cooking To-Do List

A fully serverless, dynamic AI-powered meal planner designed specifically for GitHub Pages deployment.

## Hackathon Links
- **GitHub Repository**: [Insert GitHub Link Here]
- **Deployed Link (GitHub Pages)**: [Insert Deployed Link Here]

## Key Solution 🗝️
The core challenge was to build a robust, AI-powered meal planner that is entirely **serverless** (to allow free hosting on GitHub Pages) and highly personalized (schedule, budget, and dietary preferences).

Our key solution involves a **100% client-side architecture**:
- **Database**: Instead of a traditional backend DB, we use **IndexedDB (via Dexie.js)** to persistently store user profiles and generation history directly in the browser.
- **AI Inference**: Instead of paying for external API calls, we use **Transformers.js** to run a lightweight LLM/Text-Generation model directly in the user's browser via WebAssembly/WebGPU. 
- **Accessibility & UX**: We implemented a pure Vanilla CSS glassmorphic design system with dark/light mode and a Web Speech API for reading plans aloud.

## GenAI Services Used 🤖
We utilized **Transformers.js** (`@xenova/transformers`) as our GenAI service. 
By loading a lightweight model (`Xenova/LaMini-Flan-T5-77M`) in a dedicated Web Worker, we execute AI reasoning locally on the client's machine. This guarantees zero server costs, infinite scalability, and maximum data privacy. The AI output is used to dynamically inject creative context into our rigorously structured JSON meal planner logic.

## Features
- **Dynamic Calorie Adjustment**: Caloric baseline changes automatically if your day is sedentary, moderate, or intense.
- **Dietary Precision**: Fully supports vegetarian and specific non-vegetarian choices (e.g., Chicken, Fish).
- **Budget Logic (INR)**: Generates 3 tiered choices (Budget Saver, Standard, Premium) based on your inputted budget, highlighting if a premium choice exceeds your limits.
- **Voice Reader**: Click "Listen" to have the browser read your meal plan out loud.
- **History Tracking**: All generated and selected plans are saved offline to your IndexedDB.

## Local Setup
1. Clone the repository.
2. Run `npm install`
3. Run `npm run dev`
4. Run tests with `npx vitest`

Enjoy your AI-generated meals!
