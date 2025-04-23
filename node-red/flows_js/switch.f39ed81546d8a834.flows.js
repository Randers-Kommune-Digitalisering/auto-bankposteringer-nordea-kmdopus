const Node = {
  "id": "f39ed81546d8a834",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "transactionsWithNoMatch?",
  "property": "transactions.addUnmatched",
  "propertyType": "global",
  "rules": [
    {
      "t": "nempty"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 605,
  "y": 220,
  "wires": [
    [
      "86dbc8509bd896f0"
    ],
    [
      "992cba6f7c21b6c7",
      "0ffd26fb15dfb91f"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;