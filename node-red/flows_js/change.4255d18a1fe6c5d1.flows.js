const Node = {
  "id": "4255d18a1fe6c5d1",
  "type": "change",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "flow to msg",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "omposteringsarray",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "flow"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 490,
  "y": 60,
  "wires": [
    [
      "7752629d4e44c49b"
    ]
  ],
  "_order": 209
}

module.exports = Node;