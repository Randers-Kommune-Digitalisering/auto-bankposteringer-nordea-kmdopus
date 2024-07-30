const Node = {
  "id": "1016f4ed19ada96b",
  "type": "change",
  "z": "VueExample",
  "g": "654ea7d5e05117db",
  "name": "Create status object",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{ \"success\": true }",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 165,
  "y": 60,
  "wires": [
    [
      "5a90ebbf9bf703ec"
    ]
  ],
  "l": false
}

module.exports = Node;