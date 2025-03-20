const Node = {
  "id": "d0cd29dcaf700d9f",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "622bd279325fcb5d",
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
  "x": 745,
  "y": 240,
  "wires": [
    [
      "e28eea4e9953fb0e"
    ],
    [
      "86f72d66ea33305f"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;