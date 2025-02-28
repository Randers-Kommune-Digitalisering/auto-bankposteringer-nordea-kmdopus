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
      "to": "{\t    \"status\": $globalContext(\"auth\").adminStatus\t}",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 765,
  "y": 180,
  "wires": [
    [
      "d71d10100c5d38ba"
    ]
  ],
  "l": false
}

module.exports = Node;