# Static Frontier

A radio tuning puzzle game built for Reddit using the Devvit platform. Players tune radio frequencies to decode mysterious signals and solve meta-puzzles to claim ASCII territory on a global map.

## 🎯 Game Features

### Radio Tuning Interface

- **Interactive Dials**: Circular frequency (0-108 MHz) and modulation (0-50%) sliders
- **Real-time SFX**: Dynamic audio feedback with mute controls
- **Signal Preview**: Live ASCII slot animation showing nearest phrase
- **Visual Feedback**: Animated signal strength bars with hover effects

### Signal Decoding System

- **ASCII Slot Animation**: Purple/violet/red gradient animations revealing phrases
- **Progressive Discovery**: Find phrases by tuning to precise frequencies
- **Spoiler Protection**: First discoveries are commented with spoiler tags
- **Live Updates**: Instant phrase display without page refresh

### Global Territory System

- **ASCII Map**: 10x10 global grid shared across all subreddits
- **Territory Claims**: First meta-solvers claim random plots with their initials
- **Plot Information**: Clickable plots show owner details and puzzle info
- **Map Completion**: 50 Echo Points bonus when all 100 plots are filled

### Echo Points Economy

- **Puzzle Submission**: +5 points for creating puzzles
- **Puzzle Solving**: +50 points for first-time solves, +5 for repeat solves
- **Global Tracking**: Points tracked across all subreddits
- **Leaderboard**: Real-time ranking system (coming soon)

### User-Generated Content

- **Puzzle Creation**: Players can submit their own puzzles
- **Unified Pool**: Built-in and user puzzles in same selection pool
- **Instant Integration**: User puzzles immediately available for play
- **Creator Rewards**: Points awarded for puzzle creation

## 🎮 Current Game State

### Puzzle System

- **Unified Pool**: Built-in puzzles + user-submitted puzzles
- **Daily Puzzles**: Built-in puzzles posted daily and pinned
- **User Puzzles**: Instantly available after submission
- **Smart Selection**: Unsolved puzzles prioritized for new games

### Social Features

- **Reddit Comments**: Automatic comments for first discoveries and solves
- **Spoiler Protection**: All sensitive information hidden behind spoiler tags
- **Achievement Recognition**: Special comments celebrate major milestones
- **Community Engagement**: Players can see who solved what and when

## 🛠 Technical Stack

### Frontend

- **React 19** + TypeScript + Tailwind CSS
- **Custom Hooks**: Game state management, SFX controls, real-time updates
- **Context API**: Shared state across all components
- **Web Audio API**: Dynamic sound effects with mute controls

### Backend

- **Express.js** + Devvit framework
- **Redis**: Game state, user points, puzzle storage, global map
- **Serverless**: Optimized for Devvit's serverless environment
- **Real-time Updates**: Live state synchronization

### Platform Integration

- **Reddit API**: Post creation, comments, user management
- **Devvit Framework**: Full Reddit integration
- **Permission System**: User-generated content support
- **Cross-subreddit**: Global features work across all subreddits

## 🚀 Development

### Quick Start

```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run deploy      # Deploy to Reddit
```

### Project Structure

```
src/
├── client/          # React frontend
│   ├── components/  # UI components
│   ├── hooks/       # Custom React hooks
│   └── main.tsx     # App entry point
├── server/          # Express backend
│   └── index.ts     # API endpoints
└── shared/          # Shared types and data
    ├── types/       # TypeScript interfaces
    ├── data/        # Built-in puzzles
    └── utils/       # Utility functions
```

### Key Components

- **RadioDial**: Interactive tuning interface with SFX
- **TuningSlot**: Live phrase preview with ASCII animation
- **PhraseDisplay**: Decoded signals with flicker effects
- **AsciiMap**: Global territory visualization
- **EchoPointsLeaderboard**: Points tracking and ranking
- **PuzzleSubmissionForm**: User puzzle creation

## 🎯 Game Flow

1. **Load Game**: System selects unsolved puzzle from unified pool
2. **Tune Radio**: Adjust frequency/modulation to find signals
3. **Decode Phrases**: Discover all phrases through precise tuning
4. **Solve Meta**: Use decoded phrases to solve final puzzle
5. **Claim Territory**: First solver claims random plot on global map
6. **Earn Points**: All players earn Echo Points for participation
7. **Create Content**: Players can submit new puzzles for the community

## 🔧 API Endpoints

### Game Management

- `GET /api/game/init` - Initialize new game with unsolved puzzle
- `POST /api/game/phrase-check` - Check frequency/modulation for phrase match
- `POST /api/game/meta-solve` - Submit meta-answer and claim territory
- `GET /api/game/map` - Get global ASCII map state
- `GET /api/game/plot/:row/:col` - Get plot information

### Puzzle System

- `POST /api/puzzles/submit` - Submit user-generated puzzle
- `GET /api/puzzles/:id` - Get specific puzzle details
- `GET /api/puzzles/category/:category` - Get puzzles by category
- `GET /api/puzzles/difficulty/:difficulty` - Get puzzles by difficulty

### Echo Points

- `GET /api/echo-points/:username` - Get user's global points
- `GET /api/echo-points/leaderboard` - Get global leaderboard
- `POST /api/daily-puzzle/post` - Post daily built-in puzzle

## 🎨 UI/UX Features

### Visual Design

- **TUI Theme**: Terminal/CLI aesthetic with green color scheme
- **Smooth Animations**: CSS transitions and keyframe animations
- **Responsive Design**: Mobile-optimized interface
- **Interactive Elements**: Hover effects and visual feedback

### Audio Experience

- **Dynamic SFX**: Frequency-based audio feedback
- **Mute Controls**: Instant audio toggle
- **Fade Effects**: Gradual volume changes for better UX
- **Context-Aware**: Audio only plays during interaction

### Performance

- **Fast Loading**: Optimized intro animation (0.8s)
- **Real-time Updates**: Live state synchronization
- **Efficient Rendering**: Optimized React components
- **Serverless Ready**: Optimized for Devvit's environment

## 📊 Current Statistics

- **Built-in Puzzles**: 5+ puzzles with varying difficulty
- **User Puzzles**: Unlimited community submissions
- **Global Map**: 100 plots across 10x10 grid
- **Echo Points**: Global tracking system
- **Social Features**: Reddit comments and recognition

## 🔮 Future Enhancements

- **Advanced Leaderboards**: Detailed ranking and statistics
- **Puzzle Categories**: Themed puzzle collections
- **Trading System**: Echo Points marketplace
- **Faction Wars**: Team-based territory control
- **Real-time Multiplayer**: Live collaborative solving
- **Achievement System**: Badges and milestones
- **Puzzle Editor**: Advanced puzzle creation tools

---

**Version**: 2.0.0 - Latest  
**Platform**: Reddit Devvit  
**Status**: Production Ready  
**Community**: Active Development

Built with ❤️ for the Reddit community using Devvit.
