const Node = {
  "id": "be0a51d36be4d3e8",
  "type": "change",
  "z": "c5347a17d8894f3e",
  "name": "Flow til msg",
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
  "x": 350,
  "y": 200,
  "wires": [
    [
      "1b056c7bdfe3fc6e",
      "298793dbd22239c7"
    ]
  ],
  "_order": 80
}

module.exports = Node;