const Node = {
  "id": "1d419efdded54930",
  "type": "change",
  "z": "6cc161e748b99815",
  "g": "b23b428a2893858e",
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
  "x": 230,
  "y": 640,
  "wires": [
    [
      "ed0816545061ff50"
    ]
  ],
  "_order": 60
}

module.exports = Node;