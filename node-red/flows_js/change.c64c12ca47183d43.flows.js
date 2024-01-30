const Node = {
  "id": "c64c12ca47183d43",
  "type": "change",
  "z": "f91accb007eed9a2",
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
  "x": 1190,
  "y": 140,
  "wires": [
    [
      "3ea0dcdec4ba6a80"
    ]
  ],
  "_order": 261
}

module.exports = Node;