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
      "t": "istype",
      "v": "undefined",
      "vt": "undefined"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 375,
  "y": 80,
  "wires": [
    [
      "dfe6a36d2b87d4fb"
    ],
    [
      "fe466d9de08849f7"
    ],
    [
      "fe466d9de08849f7"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;