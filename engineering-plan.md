# Dad App Engineering Plan

## Overview
This document outlines the engineering plan for building the Dad app, a personal companion app for Andrew Liebchen. The plan follows an iterative approach using the skateboard > bike > motorcycle > car model, allowing for functional iterations at each stage.

## Technical Stack
- **Framework**: Expo with Expo Go for development
- **State Management**: React Context API (ThemeProvider)
- **Navigation**: React Navigation (Native Stack)
- **API**: OpenAI GPT-4
- **Local Storage**: SQLite (expo-sqlite)
- **Push Notifications**: Expo Notifications (planned)
- **Deployment**: TestFlight (iOS only)

## Project Structure
```
dad-app/
├── src/
│   ├── screens/
│   │   └── ChatScreen.tsx       # Main chat interface with thread management
│   ├── components/
│   │   └── ThreadList.tsx       # Thread selection and management UI
│   ├── services/
│   │   ├── database.ts         # SQLite database service
│   │   ├── openai.ts          # OpenAI API integration
│   │   └── dadPersonality.ts  # Dad's personality system
│   ├── theme/
│   │   ├── components.tsx     # Theme-aware UI components
│   │   └── ThemeProvider.tsx  # Theme context and provider
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── assets/                    # Static assets
└── App.tsx                    # Root component and navigation setup
```

## Phase 1: Skateboard (MVP) - ✅ COMPLETED
**Goal**: Create a basic functional app with core chat functionality and local storage.

**Features**:
1. ✅ Basic chat interface with Dad
   - Message bubbles with user/Dad distinction
   - Input field with send button
   - Enter key support for sending messages
2. ✅ Simple theme implementation with Theme UI
   - Dark/light mode support
   - Consistent styling across components
3. ✅ Local storage for conversation history
   - SQLite database implementation
   - Thread-based conversation management
   - Message persistence
4. ✅ Basic error handling and loading states
   - API error handling
   - Loading indicators
   - Error messages in chat
5. ✅ Dad's personality and background setup
   - Core personality traits defined
   - Background details established
   - Prompting system implemented
   - Emotional intelligence and support focus

**Implementation Details**:
1. **Database Schema**:
   ```sql
   -- Threads table
   CREATE TABLE threads (
     id TEXT PRIMARY KEY NOT NULL,
     title TEXT NOT NULL,
     createdAt INTEGER NOT NULL,
     lastMessageAt INTEGER NOT NULL
   );

   -- Messages table
   CREATE TABLE messages (
     id TEXT PRIMARY KEY NOT NULL,
     text TEXT NOT NULL,
     isUser INTEGER NOT NULL,
     timestamp INTEGER NOT NULL,
     threadId TEXT NOT NULL,
     FOREIGN KEY (threadId) REFERENCES threads (id)
   );
   ```

2. **Key Components**:
   - `ChatScreen`: Main interface handling message display and input
   - `ThreadList`: Manages chat thread selection and creation
   - `DatabaseService`: Handles all SQLite operations
   - `ThemeProvider`: Manages app-wide theming

3. **State Management**:
   - Local state for messages and UI
   - Context for theme management
   - SQLite for persistent storage

## Phase 2: Bike (In Progress)
**Goal**: Enhance the app with persistent memory and improved UI/UX.

**Features**:
1. Conversation history with summarization
2. Improved UI with animations and transitions
3. Basic mood tracking
4. Push notifications for check-ins

**Implementation Steps**:
1. Implement conversation history view
2. Add basic summarization using GPT-4
3. Create mood tracking UI and storage
4. Set up push notifications
5. Enhance UI with animations

## Phase 3: Motorcycle
**Goal**: Add advanced features and improve the overall experience.

**Features**:
1. Creative companion mode
2. Visual timeline for mood tracking
3. Enhanced memory system
4. Improved check-in system

**Implementation Steps**:
1. Implement creative companion mode with photo/note storage
2. Create visual timeline for mood tracking
3. Enhance memory system with better summarization
4. Improve check-in system with more personalized prompts

## Phase 4: Car
**Goal**: Polish the app and add final touches.

**Features**:
1. Advanced personalization
2. Performance optimizations
3. Final UI/UX improvements
4. TestFlight deployment

**Implementation Steps**:
1. Implement advanced personalization options
2. Optimize performance and reduce API calls
3. Final UI/UX improvements
4. Prepare for TestFlight deployment

## Development Workflow
1. Set up development environment with Expo Go
2. Implement features iteratively
3. Test on physical device
4. Deploy to TestFlight for beta testing

## Success Metrics
- The app feels emotionally real and personally helpful
- Andrew wants to open it, not because he "should," but because it helps
- It evolves with Andrew and stays relevant to his emotional and creative life 