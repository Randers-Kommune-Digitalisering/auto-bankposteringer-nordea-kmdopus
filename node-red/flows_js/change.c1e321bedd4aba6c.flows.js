const Node = {
  "id": "c1e321bedd4aba6c",
  "type": "change",
  "z": "0b526691b09a2646",
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
  "x": 1390,
  "y": 560,
  "wires": [
    [
      "bcdfa51e0609f9ca"
    ]
  ],
  "_order": 198
}

module.exports = Node;