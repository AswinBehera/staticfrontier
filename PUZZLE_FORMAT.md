# Static Frontier Puzzle Format

This document describes how to create and format puzzles for the Static Frontier game.

## Puzzle Structure

Each puzzle is defined in `/src/shared/data/puzzles.json` and follows this structure:

```json
{
  "id": "unique-puzzle-identifier",
  "title": "Puzzle Display Name",
  "description": "Brief description of the puzzle theme",
  "metaAnswer": "The correct answer to the meta puzzle",
  "hints": [
    "Optional hint 1",
    "Optional hint 2",
    "Optional hint 3"
  ],
  "phrases": [
    {
      "frequency": 44.2,
      "modulation": 18.5,
      "text": "The decoded phrase text"
    }
  ],
  "difficulty": "easy|medium|hard|expert",
  "category": "category-id"
}
```

## Field Descriptions

### Required Fields

- **`id`**: Unique identifier for the puzzle (kebab-case recommended)
- **`title`**: Display name shown to players
- **`description`**: Brief thematic description
- **`metaAnswer`**: The correct answer players must submit
- **`phrases`**: Array of 4-5 phrases with frequency/modulation coordinates
- **`difficulty`**: One of: `easy`, `medium`, `hard`, `expert`
- **`category`**: Category ID (see categories section)

### Optional Fields

- **`hints`**: Array of helpful hints (not currently used in UI but available)

### Phrase Structure

Each phrase in the `phrases` array must have:

- **`frequency`**: Number between 0-108 (MHz)
- **`modulation`**: Number between 0-50 (%)
- **`text`**: The decoded phrase text

## Categories

Available categories are defined in the `categories` array:

- **`landmarks`**: Famous Landmarks - Iconic structures and monuments
- **`space`**: Space Exploration - Missions, discoveries, cosmic phenomena
- **`technology`**: Technology - Inventions and innovations
- **`history`**: Historical Events - Pivotal moments in history
- **`science`**: Scientific Concepts - Breakthrough discoveries and theories

## Difficulties

- **`easy`**: Straightforward puzzles with clear clues
- **`medium`**: Moderate challenge requiring some thinking
- **`hard`**: Complex puzzles for experienced solvers
- **`expert`**: Extremely challenging puzzles for experts

## Signal Strength Logic

The signal strength indicator now works based on proximity to actual puzzle frequencies:

1. **Distance Calculation**: Uses Euclidean distance between current dial position and each puzzle phrase
2. **Signal Strength**: `1 - (distance / maxDistance)` where maxDistance = 20
3. **Visual Display**: 10 bars showing signal strength (0-10 bars)
4. **Real-time Updates**: Updates as you move the dials

This means:
- **Strong signal** (8-10 bars): Very close to a puzzle frequency
- **Medium signal** (4-7 bars): Moderately close
- **Weak signal** (1-3 bars): Somewhat close
- **No signal** (0 bars): Far from any puzzle frequency

## Creating New Puzzles

### Step 1: Choose a Theme
Pick a topic that can be broken down into 4-5 clues leading to a meta-answer.

### Step 2: Design the Meta-Answer
The meta-answer should be:
- A single, specific answer (not multiple possibilities)
- Something that can be deduced from the phrases
- Interesting and educational

### Step 3: Create the Phrases
Write 4-5 phrases that:
- Provide clues about the meta-answer
- Are poetic or cryptic (not too obvious)
- Build upon each other
- Lead logically to the final answer

### Step 4: Assign Frequencies
Choose frequency/modulation pairs that:
- Are spread across the available range (0-108 MHz, 0-50%)
- Don't overlap too closely with existing puzzles
- Are easy to remember or have some pattern

### Step 5: Test the Puzzle
- Verify all phrases can be decoded
- Ensure the meta-answer is solvable
- Check that hints are helpful but not too revealing

## Example Puzzle Creation

```json
{
  "id": "my-custom-puzzle",
  "title": "The Digital Revolution",
  "description": "A transformation that changed everything",
  "metaAnswer": "Smartphone",
  "hints": [
    "Think of what you're holding right now",
    "Combines phone, computer, and camera",
    "First introduced by Apple in 2007"
  ],
  "phrases": [
    {
      "frequency": 25.3,
      "modulation": 12.7,
      "text": "a computer in your pocket, more powerful than Apollo"
    },
    {
      "frequency": 48.9,
      "modulation": 23.4,
      "text": "touch screen interface, no buttons needed"
    },
    {
      "frequency": 71.2,
      "modulation": 35.8,
      "text": "camera, GPS, internet, all in one device"
    },
    {
      "frequency": 95.6,
      "modulation": 42.1,
      "text": "revolutionary device that changed how we communicate"
    }
  ],
  "difficulty": "medium",
  "category": "technology"
}
```

## API Endpoints

The puzzle system provides these endpoints:

- `GET /api/puzzles` - Get all puzzles
- `GET /api/puzzles/:id` - Get specific puzzle
- `GET /api/puzzles/category/:category` - Get puzzles by category
- `GET /api/puzzles/difficulty/:difficulty` - Get puzzles by difficulty

## Integration

Puzzles are automatically loaded when a new game starts. The system will:
1. Select a random puzzle from the available set
2. Convert it to the game's broadcast format
3. Initialize the game state with the puzzle data

To add new puzzles, simply edit the `puzzles.json` file and restart the server.
