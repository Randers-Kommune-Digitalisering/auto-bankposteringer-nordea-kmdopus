const Node = {
  "id": "9ee75dfeaa6942a2",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "af45fb910a71600f",
  "name": "accessDuration",
  "property": "accessDuration",
  "propertyType": "global",
  "rules": [
    {
      "t": "gt",
      "v": "200000",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 105,
  "y": 600,
  "wires": [
    [
      "6278ffd72bf9c641"
    ],
    [
      "f12b59ff80368314"
    ]
  ],
  "l": false
}

module.exports = Node;