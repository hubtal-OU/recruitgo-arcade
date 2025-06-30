# RecruitGo Quiz Arcade

A retro-style two-player arcade quiz game built with Node.js, Express, and static HTML/CSS/JavaScript. Now with full arcade controller support!

## Features
- Two-player real-time quiz gameplay
- Retro arcade visuals and sound effects
- Employer of Record (EOR) and remote work themed questions
- **Arcade controller support** (8-button zero-delay PC controller)
- Auto-start functionality when controller is connected
- Keyboard controls for testing (QWER/UIOP keys)
- Raspberry Pi optimized for arcade cabinets
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

## Arcade Controller Setup

### Controller Mapping
The game supports 8-button zero-delay PC controllers with the following mapping:
- **Player 1**: Buttons 0-3 (Green, Red, Yellow, Blue)
- **Player 2**: Buttons 4-7 (Green, Red, Yellow, Blue)
- **Special**: Green buttons (0 or 4) also start/restart the game from any screen

### Raspberry Pi Setup
For a full arcade cabinet experience:

1. **Quick Setup**: Run the automated setup script:
   ```bash
   chmod +x setup-pi.sh
   ./setup-pi.sh
   ```

2. **Manual Setup**:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install game dependencies
   npm install
   
   # Set up auto-start service
   sudo cp arcade-quiz.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable arcade-quiz.service
   sudo systemctl start arcade-quiz.service
   ```

3. **Controller Permissions**:
   ```bash
   sudo usermod -a -G input pi
   ```

### Auto-Start Features
- Game automatically starts when the Raspberry Pi boots
- Browser opens in kiosk mode for full-screen experience
- Controller connection triggers game auto-start after 3 seconds
- **Green buttons** (0 or 4) can start/restart the game instantly
- Large, obvious arcade-style buttons with visual feedback
- No keyboard/mouse needed once set up

### Testing Controls
- **Keyboard controls** are available for testing:
  - Player 1: Q (Green), W (Blue), E (Red), R (Yellow)
  - Player 2: U (Green), I (Blue), O (Red), P (Yellow)

## Multiplayer
- For local network play, use your computer's local IP address (see instructions above).
- For global play, deploy to a public host (see below).

## Deploying to Fly.io
1. [Sign up for Fly.io](https://fly.io/) and install the Fly CLI.
2. Run `flyctl launch` in your project directory and follow the prompts.
3. Deploy with `flyctl deploy`.
4. Share your Fly.io app URL with players!

## Troubleshooting

### Controller Not Detected
- Check if controller is connected: `ls /dev/input/js*`
- Test controller input: `jstest /dev/input/js0`
- Verify permissions: `groups $USER` (should include 'input')

### Service Issues
- Check service status: `sudo systemctl status arcade-quiz.service`
- View logs: `sudo journalctl -u arcade-quiz.service -f`
- Restart service: `sudo systemctl restart arcade-quiz.service`

### Browser/Kiosk Issues
- Disable screen saver: Add `xset s off` to autostart
- Hide cursor: Install `unclutter` package
- Full screen issues: Try F11 or adjust browser flags in service

### Controller Button Mapping
If your controller buttons don't match the expected mapping, you can test button indices using the browser console (F12) and checking the gamepad API output.

## License
MIT 