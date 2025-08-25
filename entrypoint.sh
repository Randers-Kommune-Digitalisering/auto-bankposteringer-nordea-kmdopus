#!/bin/bash

trap stop SIGINT SIGTERM

chown -R node-red:node-red /data
find /data -type f -exec chown node-red:node-red {} +
chmod -R u+rwX /data

function stop() {
	kill $EXPRESS_PID
	kill $NODE_RED_PID
	wait $EXPRESS_PID
	wait $NODE_RED_PID
}

/usr/local/bin/node /app/express/server.js &

EXPRESS_PID="$!"

/usr/local/bin/node $NODE_OPTIONS node_modules/node-red/red.js --userDir /data $FLOWS "${@}" &

NODE_RED_PID="$!"

wait