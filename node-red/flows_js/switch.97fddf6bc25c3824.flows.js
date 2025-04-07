const Node = {
  "id": "97fddf6bc25c3824",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "202a6b173abfc606",
  "name": "manual posting to process?",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "nempty"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 105,
  "y": 860,
  "wires": [
    [
      "075475a32b89c455"
    ],
    [
      "da9d0b8038e2bfe1"
    ]
  ],
  "outputLabels": [
    "true",
    "false"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;