#!/bin/bash

trap stop SIGINT SIGTERM

function stop() {
	kill $EXPRESS_PID
	kill $NODE_RED_PID
	wait $EXPRESS_PID
	wait $NODE_RED_PID
}

/usr/local/bin/node /app/express/server.js &

EXPRESS_PID="$!"

# When /data is bind-mounted from host, image-installed modules can be hidden.
# Ensure userDir dependencies exist before starting Node-RED.
if [[ -f /data/package.json && ! -d /data/node_modules ]]; then
	cd /data || exit 1
	npm install --no-update-notifier --no-fund --omit=dev
	cd /usr/src/node-red || exit 1
fi

/usr/local/bin/node $NODE_OPTIONS node_modules/node-red/red.js --userDir /data $FLOWS "${@}" &

NODE_RED_PID="$!"

wait