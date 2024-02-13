const Node = {
  "id": "c64c12ca47183d43",
  "type": "change",
  "z": "7cf1e6fdd27d0bd8",
  "g": "c2ddb5ae767f1292",
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
      "3ea0dcdec4ba6a80"
    ]
  ],
  "_order": 240
}

module.exports = Node;