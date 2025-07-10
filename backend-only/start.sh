#!/bin/sh

# Validate and set PORT
if [ -z "$PORT" ]; then
    echo "PORT not set, using default: 5000"
    export PORT=5000
elif ! echo "$PORT" | grep -E '^[0-9]+$' > /dev/null; then
    echo "Invalid PORT value: $PORT, using default: 5000"
    export PORT=5000
elif [ "$PORT" -lt 0 ] || [ "$PORT" -gt 65535 ]; then
    echo "PORT out of range: $PORT, using default: 5000"
    export PORT=5000
else
    echo "Using PORT: $PORT"
fi

# Start the application
echo "Starting server on port: $PORT"
npm start 