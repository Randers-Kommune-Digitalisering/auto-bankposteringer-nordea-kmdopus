const Node = {
  "id": "b73eae993793d2e5",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "608c296403fab569",
  "name": "Flow to msg",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "omposteringsarray",
      "tot": "global",
      "dc": true
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "flow",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 250,
  "y": 560,
  "wires": [
    [
      "e19e623080066c4c"
    ]
  ],
  "_order": 38
}

module.exports = Node;