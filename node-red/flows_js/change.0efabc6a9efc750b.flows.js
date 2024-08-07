const Node = {
  "id": "0efabc6a9efc750b",
  "type": "change",
  "z": "202e1898db8daa8b",
  "g": "9c38e354c5cb0cbe",
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
  "x": 105,
  "y": 60,
  "wires": [
    [
      "2b66e53239dcbf3d"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;