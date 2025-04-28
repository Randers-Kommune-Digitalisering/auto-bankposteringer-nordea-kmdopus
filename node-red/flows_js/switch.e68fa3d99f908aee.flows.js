const Node = {
  "id": "e68fa3d99f908aee",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "340a8358eb5b957c",
  "name": "run restarted?",
  "property": "runs.restart",
  "propertyType": "global",
  "rules": [
    {
      "t": "true"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 375,
  "y": 80,
  "wires": [
    [
      "6c2d2361da8e071c"
    ],
    [
      "227e1ddaf3ee20a7"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;