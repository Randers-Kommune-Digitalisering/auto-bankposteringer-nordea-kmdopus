const Node = {
  "id": "227e1ddaf3ee20a7",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "340a8358eb5b957c",
  "name": "hit?",
  "property": "payload",
  "propertyType": "msg",
  "rules": [
    {
      "t": "empty"
    },
    {
      "t": "nempty"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 325,
  "y": 80,
  "wires": [
    [
      "b395a5509ee2a393"
    ],
    [
      "6c2d2361da8e071c"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;