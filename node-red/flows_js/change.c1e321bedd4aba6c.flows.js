const Node = {
  "id": "c1e321bedd4aba6c",
  "type": "change",
  "z": "707b29a288c1c947",
  "g": "3d885db7955a47b8",
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
  "x": 610,
  "y": 180,
  "wires": [
    [
      "bcdfa51e0609f9ca"
    ]
  ],
  "_order": 265
}

module.exports = Node;