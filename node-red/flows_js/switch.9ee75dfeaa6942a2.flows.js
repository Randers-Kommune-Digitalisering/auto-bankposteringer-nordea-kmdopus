const Node = {
  "id": "9ee75dfeaa6942a2",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "af45fb910a71600f",
  "name": "",
  "property": "accessDuration",
  "propertyType": "global",
  "rules": [
    {
      "t": "gt",
      "v": "0",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 115,
  "y": 920,
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