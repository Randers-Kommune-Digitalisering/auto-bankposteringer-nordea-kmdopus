const Node = {
  "id": "e91e9572f2d75574",
  "type": "switch",
  "z": "32cf2bec698ca424",
  "g": "88a5a801e4bf7e08",
  "name": "Has uid?",
  "property": "uid",
  "propertyType": "msg",
  "rules": [
    {
      "t": "nnull"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 245,
  "y": 1020,
  "wires": [
    [
      "b18d8a5195c23c7a"
    ],
    [
      "065dea81f9e031b7"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;