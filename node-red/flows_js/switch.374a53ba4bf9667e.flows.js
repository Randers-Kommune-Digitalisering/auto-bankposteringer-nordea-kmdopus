const Node = {
  "id": "374a53ba4bf9667e",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "if not empty array",
  "property": "files",
  "propertyType": "msg",
  "rules": [
    {
      "t": "nempty"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 275,
  "y": 1240,
  "wires": [
    [
      "check-files"
    ],
    [
      "log-deletion"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;