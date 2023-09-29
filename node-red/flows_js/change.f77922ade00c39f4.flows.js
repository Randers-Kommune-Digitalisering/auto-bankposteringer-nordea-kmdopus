const Node = {
  "id": "f77922ade00c39f4",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "0908d601e13c4ce9",
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
  "x": 370,
  "y": 180,
  "wires": [
    [
      "70775b57865160c6"
    ]
  ],
  "_order": 117
}

module.exports = Node;