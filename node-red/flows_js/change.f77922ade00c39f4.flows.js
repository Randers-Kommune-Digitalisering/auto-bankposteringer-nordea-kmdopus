const Node = {
  "id": "f77922ade00c39f4",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "a6a44c3ca7a42667",
  "name": "Flow to msg",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "debitorposter",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "columns",
      "pt": "msg",
      "to": "omp_headers",
      "tot": "global",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 490,
  "y": 1280,
  "wires": [
    [
      "70775b57865160c6"
    ]
  ],
  "_order": 237
}

module.exports = Node;