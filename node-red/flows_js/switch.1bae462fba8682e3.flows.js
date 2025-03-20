const Node = {
  "id": "1bae462fba8682e3",
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
  "y": 240,
  "wires": [
    [
      "a52457ed55960f9b"
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