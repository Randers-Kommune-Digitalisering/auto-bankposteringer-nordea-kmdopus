const Node = {
  "id": "be0a51d36be4d3e8",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "67c340b82556b251",
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
  "y": 580,
  "wires": [
    [
      "1b056c7bdfe3fc6e"
    ]
  ],
  "_order": 81
}

module.exports = Node;