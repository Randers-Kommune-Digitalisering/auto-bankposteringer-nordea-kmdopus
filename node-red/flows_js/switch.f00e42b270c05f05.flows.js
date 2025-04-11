const Node = {
  "id": "f00e42b270c05f05",
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
  "x": 605,
  "y": 240,
  "wires": [
    [
      "c1b47442eeb89524"
    ],
    [
      "d758489618d9c1e7",
      "21155b91521dc3b1"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;