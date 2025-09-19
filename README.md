# Static Frontier

A radio tuning puzzle game built for Reddit using the Devvit platform. Players tune radio frequencies to decode mysterious signals and solve meta-puzzles to claim ASCII territory.

## Game Features

### Radio Tuning Interface
- **Frequency Dial**: Tune from 0-108 MHz to find signals
- **Modulation Dial**: Adjust modulation from 0-50% for signal clarity
- **Real-time Feedback**: Visual indicators when signals are detected

### Signal Decoding
- **ASCII Flicker Animation**: Signals resolve from random characters into coherent phrases
- **Vibrant Gradients**: Purple, violet, and red color schemes for visual appeal
- **Progressive Discovery**: Find all 4 phrases to unlock the meta-puzzle

### Meta-Puzzle & Territory
- **Meta-Answer**: Solve the final puzzle using all decoded phrases
- **ASCII Map**: 10x10 grid showing claimed territory
- **Winner System**: First correct solver claims the territory
- **Echo Points**: Late solvers earn Echo Points instead of territory

## Current Broadcast: "The Exile's Lantern"

**Meta Answer**: Statue of Liberty

**Phrases to Find**:
1. Frequency: 44.2 MHz, Modulation: 18.5% - "a gift from across the sea, bones of copper, skin of green"
2. Frequency: 63.8 MHz, Modulation: 21.1% - "she holds fire in her hand, but it never burns"
3. Frequency: 79.7 MHz, Modulation: 37.4% - "the exiles' first vision, a sentinel of arrival"
4. Frequency: 82.0 MHz, Modulation: 42.0% - "coordinates 40°41′N 74°2′W, brighter than any star in our charts"

## Technical Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Devvit framework
- **Database**: Redis for game state persistence
- **Platform**: Reddit's Devvit platform
- **Theme**: TUI/CLI dark theme with terminal aesthetics

## Development

### Commands
- `npm run dev`: Start development server
- `npm run build`: Build client and server
- `npm run deploy`: Upload to Reddit
- `npm run launch`: Publish for review

### Architecture
- **Client**: React components for radio tuning, phrase display, and ASCII map
- **Server**: Express endpoints for game logic and Redis persistence
- **Shared**: TypeScript types for API communication

## Game Flow

1. **Tune Radio**: Adjust frequency and modulation dials
2. **Decode Signals**: Find all 4 phrases through precise tuning
3. **Solve Meta**: Use decoded phrases to solve the final puzzle
4. **Claim Territory**: First solver wins ASCII land ownership
5. **Earn Points**: Late solvers get Echo Points for participation

## Future Enhancements

- Rive animations for radio tuning interface
- Multiple broadcast puzzles
- Trading system for Echo Points
- Faction-based territory control
- Real-time multiplayer features

Built with ❤️ for the Reddit community using Devvit.
