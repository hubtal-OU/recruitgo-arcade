#!/bin/bash

# Arcade Quiz - Raspberry Pi Setup Script
echo "Setting up Arcade Quiz Game on Raspberry Pi..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install dependencies
echo "Installing game dependencies..."
npm install

# Copy systemd service file
echo "Setting up auto-start service..."
sudo cp arcade-quiz.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable arcade-quiz.service

# Configure auto-login (optional)
echo "Configuring auto-login..."
sudo systemctl set-default multi-user.target
sudo systemctl enable getty@tty1.service

# Configure auto-start browser in kiosk mode (optional)
echo "Setting up kiosk mode..."
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/arcade-quiz.desktop << EOF
[Desktop Entry]
Type=Application
Name=Arcade Quiz Kiosk
Exec=chromium-browser --kiosk --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state http://localhost:3000
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Set up controller permissions
echo "Setting up controller permissions..."
sudo usermod -a -G input pi

# Create udev rule for controller (optional - adjust vendor/product ID as needed)
cat > /tmp/99-arcade-controller.rules << EOF
# Arcade Controller Rules
SUBSYSTEM=="input", ATTRS{idVendor}=="*", ATTRS{idProduct}=="*", MODE="0666", GROUP="input"
KERNEL=="js[0-9]*", MODE="0666", GROUP="input"
EOF
sudo mv /tmp/99-arcade-controller.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules

echo "Setup complete!"
echo ""
echo "To start the service manually: sudo systemctl start arcade-quiz.service"
echo "To check service status: sudo systemctl status arcade-quiz.service"
echo "To view logs: sudo journalctl -u arcade-quiz.service -f"
echo ""
echo "The game will auto-start on boot and be available at http://localhost:3000"
echo "Connect your arcade controller and the game should auto-start!"
echo ""
echo "Reboot the Pi to test the complete setup: sudo reboot" 