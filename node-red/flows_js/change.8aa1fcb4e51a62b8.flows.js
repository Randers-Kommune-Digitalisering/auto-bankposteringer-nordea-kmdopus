const Node = {
  "id": "8aa1fcb4e51a62b8",
  "type": "change",
  "z": "707b29a288c1c947",
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
  "x": 340,
  "y": 180,
  "wires": [
    [
      "e5cf89af3bc77a2c"
    ]
  ],
  "_order": 262
}

module.exports = Node;