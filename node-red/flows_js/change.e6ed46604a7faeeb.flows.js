const Node = {
  "id": "e6ed46604a7faeeb",
  "type": "change",
  "z": "2d5de3ec9a4f11b6",
  "g": "1e0e1f57083661ef",
  "name": "flow to msg",
  "rules": [
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "nomatch_omposteringsarray",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1110,
  "y": 60,
  "wires": [
    [
      "796b7468147dc04d"
    ]
  ]
}

module.exports = Node;