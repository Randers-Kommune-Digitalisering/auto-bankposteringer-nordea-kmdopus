const Node = {
  "id": "e23d15d4a4febccf",
  "type": "change",
  "z": "7cf1e6fdd27d0bd8",
  "g": "c2ddb5ae767f1292",
  "name": "build msg",
  "rules": [
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "flow",
      "dc": true
    },
    {
      "t": "set",
      "p": "nomatch_transactions",
      "pt": "flow",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 840,
  "y": 60,
  "wires": [
    [
      "7a3684be602309cb"
    ]
  ],
  "_order": 228
}

module.exports = Node;