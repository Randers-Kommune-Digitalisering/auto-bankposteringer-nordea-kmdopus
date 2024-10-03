const Node = {
  "id": "9ee75dfeaa6942a2",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "af45fb910a71600f",
  "name": "Less than 10 days",
  "property": "accessDuration",
  "propertyType": "flow",
  "rules": [
    {
      "t": "gt",
      "v": "14400",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 115,
  "y": 740,
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