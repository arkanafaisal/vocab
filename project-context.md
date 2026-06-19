# Project Context: Backend

## Tech Stack Overview
- **Core**: Node.js, Express v5
- **Database & Caching**: MongoDB, MySQL2, Redis
- **Real-time Communication**: Socket.io
- **Authentication & Security**: JSON Web Token (JWT), bcrypt, cookie-parser, cors
- **Validation**: Joi
- **Mailing**: Nodemailer
- **Utilities**: dotenv

## API Features

Based on the `backend/routes` directory structure, here is the list of main API routes and their functionalities:

### 1. Authentication (`/api/auth`)
* **Register** (`POST /register`):
  - **Features**: Registers a new user account into the system.
  - **Request**: Body `{ username, email, password }`
* **Login** (`POST /login`):
  - **Features**: Authenticates a user and issues access/refresh tokens.
  - **Request**: Body `{ username/email, password }`
  - **Response**: `{ id, username, email, score, streak }`, Cookies `accessToken, refreshToken`
* **Logout** (`DELETE /logout`):
  - **Features**: Invalidates the current user session/tokens.
  - **Request**: Cookies `refreshToken`
  - **Response**: Clears Cookies
* **Refresh Token** (`POST /refresh`):
  - **Features**: Issues a new access token using a valid refresh token.
  - **Request**: Cookies `refreshToken`
  - **Response**: Cookies `accessToken, refreshToken`

### 2. Users (`/api/users`)
* **User List** (`GET /`):
  - **Features**: Retrieves a list of all users.
  - **Request**: None
  - **Response**: `[{ username, score, streak }]`
* **My Profile** (`GET /me`):
  - **Features**: Retrieves the authenticated user's profile data. Requires JWT.
  - **Request**: Headers JWT `accessToken`
  - **Response**: `{ username, email, score, streak }`
* **Update Username** (`PATCH /update-username`):
  - **Features**: Updates the user's username. Requires JWT.
  - **Request**: Body `{ newUsername, password }`
* **Update Email** (`PATCH /update-email`):
  - **Features**: Initiates email update by sending a verification link via email. Requires JWT.
  - **Request**: Body `{ newEmail, password }`
* **Request Password Reset** (`PATCH /reset-password`):
  - **Features**: Initiates password reset by sending a token link via email. Requires JWT.
  - **Request**: Headers JWT `accessToken`
* **Verify Password Reset** (`PATCH /verify-reset-password`):
  - **Features**: Verifies the reset token and updates the user's password.
  - **Request**: Query token & Body `{ password }`
* **Verify Email** (`GET /verify-email`):
  - **Features**: Verifies a user's email address using a token.
  - **Request**: Query token

### 3. Data (`/api/data`)
* **Insert Data** (`POST /insert`):
  - **Features**: Inserts new vocabulary/data entries.
  - **Request**: Body `{ data_access_token, datas: [{ vocab, meaning }] }`
  - **Response**: `insertedCount`
* **Delete Data** (`POST /delete`):
  - **Features**: Deletes existing vocabulary entries.
  - **Request**: Body `{ data_access_token, datas: [vocab] }`
  - **Response**: `deletedCount`

### 4. WebSockets (`socket.io`)
* **Connection & Authorization**:
  - **Features**: Authenticates users via `accessToken` cookie. Enforces single-device session (disconnects older sessions if the same account logs in from elsewhere). Initiates a question batch containing 50 questions upon successful connection.
* **Quiz State Management (Redis)**:
  - **Data Storage**: The question batch (50 questions) is stored in Redis as a List (array of strings) under the key `vocab:questions:<username>`. The quiz session state is stored under the key `vocab:quiz:<username>` as an object `{ currentIndex, streak }`.
  - **Pointer Method**: Uses an **Index Pointer** (`currentIndex`). Questions are fetched without mutating the array using Redis `LINDEX`. The pointer increments by 1 after every submitted answer.
* **`request_question`** (Event Receiver):
  - **Features**: Client requests the next quiz question. Generates a new batch in Redis if questions are exhausted or empty.
  - **Payload In**: None
  - **Emits**: `new_question` (`{ vocab, choices }`)
* **`submit_answer`** (Event Receiver):
  - **Features**: Evaluates the submitted answer. Calculates streak multipliers (points added vary based on current streak: 10, 15, 25, or 50 points), updates user score, and advances to the next question.
  - **Payload In**: `answer` (String)
  - **Emits**: `answer_result` (`{ correct, correctAnswer, streak, points_added }`)
* **`warn`** (Event Emitter):
  - **Features**: Emits warning messages for scenarios like session expiration, multi-device conflicts, or sync issues. Often followed by forceful disconnection depending on the error code severity.
  - **Payload Out**: `{ code, message }`

---

# Project Context: Frontend

## Tech Stack Overview
- **Core**: React v19, Vite, Tailwind CSS v4, socket.io-client v4

## App Structure & Routing

### 1. Architecture & Routing Method
- **Single Page Application (SPA)**: The application does not use a dedicated routing library (e.g., React Router). It relies on **Conditional Rendering** (`view` state) to switch between different sections.
- **Deep Linking via URL Hash**: Utilizes `window.location.hash` during app initialization to trigger specific modals directly from external email links:
  - `#verify-email?token=...` -> Automatically opens the `verifyProcess` modal.
  - `#reset-password?token=...` -> Automatically opens the `newPassword` modal.

### 2. Global State Management
The app uses centralized React State (`useState`) inside `App.jsx`, augmented by specialized Custom Hooks to handle complex business logic.
- **User & Game State**: `user`, `score`, `streak`, `question`, `floatingScores`.
- **UI State**: `view` (toggles between `'quiz'` and `'leaderboard'` on smaller screens), `quizUI` (manages answer selection, validation states, and complex micro-animations).
- **Global UI Elements**: `activeModal` (centralized manager for all popup modals), `toast` (for global notifications).

### 3. Layout Structure (`App.jsx`)
- **Backgrounds**: `ParticleCanvas` and `fire-vignette` (dynamic visual effects that activate based on the user's `streak`).
- **Overlays**: `Modals` component (handles Auth, Profile Management, Settings, etc.).
- **Header**: `Navbar` (displays user info, current streak, socket connection status, and mobile view toggler).
- **Main Content (`<main>`)**: A responsive layout containing two primary sections:
  - `QuizSection`: The core interactive vocabulary game area.
  - `LeaderboardSection`: Real-time ranking display.

## Components & Custom Hooks

### 1. Key Components (`/component`)
* **`QuizSection.jsx`**:
  - **Features**: Renders the current vocabulary question and multiple-choice answers. Handles complex visual feedback states (e.g., highlighting correct/wrong answers, triggering `score-pop` animations, and displaying dynamic streak fire badges).
  - **Data Displayed**: `question.vocab`, `question.choices`, localized `score` and `streak`.
* **`LeaderboardSection.jsx`**:
  - **Features**: Displays the top players globally. Dynamically merges the current user's local real-time `score` and `streak` into the list to show an accurate real-time ranking without needing to re-fetch from the server immediately. Implements a refresh button with an enforced cooldown.
  - **Data Displayed**: Array of `leaderboard` users, local user rank.
* **`Modals.jsx`**:
  - **Features**: A centralized overlay manager that handles all popup interactions, including:
    - **Authentication**: Login & Register forms.
    - **User Profile**: Displays user stats and provides options to edit Username/Email.
    - **Password Recovery**: Reset Request and New Password setup flows.
    - **System Alerts**: Disconnection warnings and global `toast` notifications.

### 2. Specialized Custom Hooks (`/hooks`)
The app delegates complex logic from components into custom React Hooks to maintain clean UI components.
* **`useSocket.js`**:
  - **Features**: Manages the Socket.IO connection lifecycle. Listens to server events (`new_question`, `answer_result`, `warn`, `connect_error`) and updates the `quizUI` state accordingly. Implements timeout safeguards if the server fails to respond.
* **`useLeaderboard.js`**:
  - **Features**: Handles fetching leaderboard data from the REST API. Implements a strict 5-second `cooldown` state mechanism to prevent users from spamming the refresh button.
* **`useQuizActions.js`**:
  - **Features**: Manages the client-side logic for submitting an answer to the socket server and locking the UI during the validation phase.

## Services & Utilities

### 1. API Integration (`/services`)
* **`fetchData.js` (Fetch Wrapper & Interceptor)**:
  - **Features**: A robust wrapper around the native `fetch` API that standardizes request headers (`application/json`) and error handling.
  - **Auto-Refresh Mechanism**: Automatically intercepts `401 Unauthorized` responses. It pauses the failed request, silently calls the `/api/auth/refresh` endpoint to obtain a new token, and automatically retries the original request. If the refresh fails, it returns `forceLogout: true` to trigger global state cleanup.
  - **Global Error Handling**: Translates `429` (Rate Limit) and `500` (Server Error) status codes into user-friendly messages.
* **`api.js`**:
  - **Features**: An organized dictionary of all backend REST API endpoints (Auth, Users, Leaderboard), keeping components clean from raw URL strings.

### 2. Utilities (`/utils`)
* **`validation.js`**: Contains Regex functions to validate inputs client-side (Username, Email, Password, UUID Token) before they are sent to the server.
* **`formatScore.js`**: Utility for formatting large score numbers.
* **`toggleFullscreen.js`**: Browser API wrapper to request or exit fullscreen mode.

---

# Project Context: Deployment & DevOps

## 1. Frontend Serving Strategy
- **Built & Served by Backend**: The React frontend is **not** deployed as a separate standalone service in production. Instead, it is built via Vite into the `react/dist` directory. The Express backend then serves these static files directly using `express.static`.
- **Hash-Based SPA Routing**: Because the backend does not have a catch-all `*` route to fallback to `index.html` for unknown paths, the frontend relies entirely on **URL Hash Routing** (e.g., `/#verify-email?token=...`). This ensures that deep links don't trigger a `404 Not Found` error from the backend.

## 2. Server Configuration & Graceful Shutdown
- **Port Management**: Runs on Port `3000` (Development) and Port `3002` (Production).
- **Graceful Termination**: The Node.js server listens for `SIGINT` and `SIGTERM` signals. Upon termination, it cleans up lingering Socket.io keys in Redis (`vocab:socket:*`) and securely closes the connection to prevent ghost sessions.

## 3. Deployment Method
- **Process Manager**: The project is deployed directly on a VPS using a process manager such as **PM2** (no Docker containerization). The backend's Graceful Shutdown mechanism ensures process restarts are handled cleanly.
