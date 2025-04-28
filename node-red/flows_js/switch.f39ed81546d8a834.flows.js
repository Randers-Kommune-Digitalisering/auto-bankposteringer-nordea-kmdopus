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
  "x": 655,
  "y": 200,
  "wires": [
    [
      "86dbc8509bd896f0"
    ],
    [
      "3d8e86693fe39c4f"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;