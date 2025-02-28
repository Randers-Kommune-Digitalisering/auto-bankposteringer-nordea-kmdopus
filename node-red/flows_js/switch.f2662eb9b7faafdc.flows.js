const Node = {
  "id": "f2662eb9b7faafdc",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "ea1bf65dfedc00a0",
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
  "x": 535,
  "y": 480,
  "wires": [
    [
      "0b5d02480ab02e58"
    ],
    [
      "d0b4f25aa6dd9eda"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;