# RecruitGo Quiz Arcade

A retro-style two-player arcade quiz game built with Node.js, Express, and static HTML/CSS/JavaScript.

## Features
- Two-player real-time quiz gameplay
- Retro arcade visuals and sound effects
- Employer of Record (EOR) and remote work themed questions
- No database or React required

## Project Structure
```
├── public/         # Static frontend (HTML, CSS, JS, sounds)
├── src/            # Node.js backend and questions
│   ├── server.js
│   └── questions.json
├── package.json
└── README.md
```

## Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node src/server.js
   ```
3. Open your browser and go to [http://localhost:3000](http://localhost:3000)

## Multiplayer
- For local network play, use your computer's local IP address (see instructions above).
- For global play, deploy to a public host (see below).

## Deploying to Fly.io
1. [Sign up for Fly.io](https://fly.io/) and install the Fly CLI.
2. Run `flyctl launch` in your project directory and follow the prompts.
3. Deploy with `flyctl deploy`.
4. Share your Fly.io app URL with players!

## License
MIT 