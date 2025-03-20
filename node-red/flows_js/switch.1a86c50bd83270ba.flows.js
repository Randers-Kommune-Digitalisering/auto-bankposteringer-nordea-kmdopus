const Node = {
  "id": "1a86c50bd83270ba",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "622bd279325fcb5d",
  "name": "postings generated?",
  "property": "erp.postings",
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
  "y": 200,
  "wires": [
    [
      "e24ed562df1850f1"
    ],
    [
      "8623331a1a94c27a"
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