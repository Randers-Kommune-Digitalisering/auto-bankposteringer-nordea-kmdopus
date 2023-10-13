const Node = {
  "id": "aa9c1b2dfd4cb399",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "608c296403fab569",
  "name": "build msg",
  "rules": [
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "global",
      "dc": true
    },
    {
      "t": "set",
      "p": "nomatch_transactions",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "global",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 840,
  "y": 740,
  "wires": [
    [
      "f00a6d76db0f4c56"
    ]
  ],
  "_order": 208
}

module.exports = Node;