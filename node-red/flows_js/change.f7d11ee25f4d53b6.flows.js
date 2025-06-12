const Node = {
  "id": "f7d11ee25f4d53b6",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "52cf6c5808bde6ed",
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
  "y": 1160,
  "wires": [
    [
      "0d23da834a7a47df"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;