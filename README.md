# 🍽️ Dinner Decider

Dinner Decider is an AI-powered household assistant designed to help roommates or families decide what to eat. It combines real-time voting, meal history tracking, user preferences, and seasonal awareness to suggest perfectly tailored dinner ideas every single day.

---

## 🏗️ System Architecture

The application is built with a modern, decoupled architecture:

### 1. **Frontend (React + Vite)**

- **Styling**: Tailwind CSS v4 with a premium "Modern Culinary" aesthetic.
- **Interactivity**: `framer-motion` for smooth, high-end transitions and `lucide-react` for iconography.
- **State Management**: React Context for user sessions and standard hooks for local component state.
- **Key Features**:
  - **Dynamic Home**: View today's 3 suggestions and cast your vote.
  - **Recipe Drawer**: A clutter-free side panel to drill down into ingredients and cooking steps without losing context.
  - **Visual Results**: Real-time progress bars showing current voting trends.
  - **Meal History**: A searchable timeline of past winners with a rating system.

### 2. **Backend (FastAPI)**

- **Framework**: High-performance Python API using FastAPI.
- **Database**: SQLite (managed via SQLAlchemy ORM).
- **Communication**: RESTful API with CORS enabled for local network sharing.

### 3. **AI Agent (Google ADK + Gemini)**

The "brain" of the app is an intelligent agent built on the **Google ADK (Agent Development Kit)**:

- **Main Agent**: Orchestrates the suggestion process based on a rich set of instructions.
- **Tools**:
  - `google_search`: Used by a delegated sub-agent to find real, high-quality recipes and YouTube videos.
  - `get_meal_history`: Ensures we don't suggest the same meal twice in a week.
  - `get_user_preferences`: Analyzes past ratings to favor cuisines the household actually likes.
  - `get_current_season`: Suggests fresh, seasonal ingredients (e.g., warmer soups in winter, fresh salads in summer).

---

## 🔄 How It Works: The Lifecycle of a Meal

### 1. **Suggestion Phase (5:00 PM Daily)**

A background scheduler triggers the AI Agent. The agent:

1. Checks who is in the household and their dietary needs (e.g., Samyak is strictly vegetarian).
2. Looks at previous winners and user preferences.
3. Searches the web for 3 distinct, high-quality recipes.
4. Saves them to the database for the household to see.

### 2. **Voting Phase**

Household members log in, view the recipes (including vegetarian alternatives for every meat dish), and cast their votes.

### 3. **Finalization (11:59 PM Daily)**

The scheduler runs a "Finalization" job:

1. Tally the votes.
2. The winner is moved to the permanent **Meal History**.
3. **Preference Learning**: The system automatically increases the "Preference Score" for that cuisine for everyone who voted for the winner.
4. If a user later rates the meal highly in the History tab, the preference scores are boosted even further.

---

## 💾 Data Storage

All information is stored locally in `backend/dinner_decider.db`.

- **`users`**: Household member profiles.
- **`meals`**: The cache of all recipes ever suggested.
- **`daily_suggestions`**: The 3 specific "candidates" for today.
- **`votes`**: Record of user selections.
- **`meal_history`**: The hall of fame for winners, including ratings and notes.
- **`preferences`**: A dynamic map of cuisine scores per user.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### Installation

1. **Clone the repository**
2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env      # Add your GOOGLE_API_KEY
   uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev -- --host
   ```

### Sharing on Local Network

Run both servers with the `--host` flag (as shown above). Your friends can access the app using your IP address (e.g., `http://192.168.1.15:5173`).
