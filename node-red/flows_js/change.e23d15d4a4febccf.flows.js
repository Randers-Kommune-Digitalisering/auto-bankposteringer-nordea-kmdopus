const Node = {
  "id": "e23d15d4a4febccf",
  "type": "change",
  "z": "f91accb007eed9a2",
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
  "x": 920,
  "y": 140,
  "wires": [
    [
      "7a3684be602309cb"
    ]
  ],
  "_order": 258
}

module.exports = Node;