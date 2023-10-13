const Node = {
  "id": "8aa1fcb4e51a62b8",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "3d885db7955a47b8",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 640,
  "y": 420,
  "wires": [
    [
      "e5cf89af3bc77a2c"
    ]
  ],
  "_order": 198
}

module.exports = Node;