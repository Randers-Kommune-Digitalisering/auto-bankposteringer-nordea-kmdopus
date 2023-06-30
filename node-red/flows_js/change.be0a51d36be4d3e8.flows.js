const Node = {
  "id": "be0a51d36be4d3e8",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "745ee7cac00b8ea6",
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
  "x": 170,
  "y": 620,
  "wires": [
    [
      "1b056c7bdfe3fc6e"
    ]
  ],
  "_order": 93
}

module.exports = Node;