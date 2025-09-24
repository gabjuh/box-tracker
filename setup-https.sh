#!/bin/bash

echo "🔐 Setting up HTTPS for local camera access..."

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "Installing mkcert..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux/RPi
        if command -v apt-get &> /dev/null; then
            curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/arm64"
            chmod +x mkcert-v*-linux-arm64
            sudo mv mkcert-v*-linux-arm64 /usr/local/bin/mkcert
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install mkcert
        fi
    fi
fi

# Create certs directory
mkdir -p certs

# Install the local CA
mkcert -install

# Get local IP address
LOCAL_IP=$(hostname -I | cut -d' ' -f1 2>/dev/null || ipconfig getifaddr en0)

# Generate certificates for localhost and local IP
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1 ::1 ${LOCAL_IP}

echo "✅ HTTPS certificates generated!"
echo "📝 Certificates saved in ./certs/"
echo "🌐 Valid for: localhost, 127.0.0.1, ${LOCAL_IP}"
echo ""
echo "⚠️  Note: You may need to accept the self-signed certificate in your browser"
echo "   Go to https://localhost:3001 and click 'Advanced' -> 'Proceed to localhost (unsafe)'"