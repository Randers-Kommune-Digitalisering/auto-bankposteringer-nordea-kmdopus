#!/bin/bash

trap stop SIGINT SIGTERM

function stop() {
	kill $EXPRESS_PID
	kill $NODE_RED_PID
	wait $EXPRESS_PID
	wait $NODE_RED_PID
}

chown -R node-red:node-red /data
find /data -type f -exec chown node-red:node-red {} +
chmod -R u+rwX /data

chown -R node-red:node-red /data/output
find /data/output -type f -exec chown node-red:node-red {} +
chmod -R u+rwX /data/output

ls -l /data/output

# /usr/local/bin/node /app/express/server.js &

# EXPRESS_PID="$!"

# /usr/local/bin/node $NODE_OPTIONS node_modules/node-red/red.js --userDir /data $FLOWS "${@}" &

# NODE_RED_PID="$!"

while true; do echo -e "HTTP/1.1 200 OK\r\nContent-Length: 0\r\n\r\n" | nc -l 8080; done &

NC_PID="$!"

wait