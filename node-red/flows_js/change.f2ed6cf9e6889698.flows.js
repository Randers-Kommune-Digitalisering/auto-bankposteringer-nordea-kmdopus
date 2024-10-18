const Node = {
  "id": "f2ed6cf9e6889698",
  "type": "change",
  "z": "32cf2bec698ca424",
  "g": "54195acebfd77c6b",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{\t    \"status\": $globalContext(\"adminAuthStatus\")\t}",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 775,
  "y": 240,
  "wires": [
    [
      "720caf0a9cba69a7"
    ]
  ],
  "l": false
}

module.exports = Node;