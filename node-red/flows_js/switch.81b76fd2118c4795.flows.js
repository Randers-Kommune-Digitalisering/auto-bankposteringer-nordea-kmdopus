const Node = {
  "id": "81b76fd2118c4795",
  "type": "switch",
  "z": "f91accb007eed9a2",
  "g": "6055094b02013d9b",
  "name": "All accounts requested?",
  "property": "account_step",
  "propertyType": "flow",
  "rules": [
    {
      "t": "eq",
      "v": "0",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 605,
  "y": 60,
  "wires": [
    [
      "f4017223fa913e7c",
      "92e6bca0b7814dbb"
    ],
    [
      "9e9927427a22300d"
    ]
  ],
  "l": false
}

module.exports = Node;