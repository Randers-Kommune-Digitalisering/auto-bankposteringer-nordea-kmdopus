const Node = {
  "id": "b73eae993793d2e5",
  "type": "change",
  "z": "707b29a288c1c947",
  "g": "608c296403fab569",
  "name": "flow to msg",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "omposteringsarray",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 290,
  "y": 60,
  "wires": [
    [
      "e19e623080066c4c"
    ]
  ],
  "_order": 253
}

module.exports = Node;