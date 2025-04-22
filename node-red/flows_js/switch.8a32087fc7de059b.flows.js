const Node = {
  "id": "8a32087fc7de059b",
  "type": "switch",
  "z": "0a57a34536934723",
  "g": "8b08bffaebfa240f",
  "name": "What is auth status?",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "FAILED",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "ACTIVE",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 3,
  "x": 245,
  "y": 120,
  "wires": [
    [
      "b516ccd7d448d865"
    ],
    [
      "b516ccd7d448d865"
    ],
    [
      "7067822959c534fb"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;