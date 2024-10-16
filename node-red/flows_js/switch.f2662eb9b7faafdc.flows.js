const Node = {
  "id": "f2662eb9b7faafdc",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "ea1bf65dfedc00a0",
  "name": "Has a run been restarted?",
  "property": "runRestart",
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
  "x": 165,
  "y": 1320,
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