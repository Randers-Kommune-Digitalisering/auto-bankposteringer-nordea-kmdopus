const Node = {
  "id": "3ecf30ab26092ccd",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "7b845d1f4aada5fa",
  "name": "Has a run been restarted?",
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
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 485,
  "y": 560,
  "wires": [
    [
      "2b9824a038130e41"
    ],
    [
      "f3a150e53bca799b"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;