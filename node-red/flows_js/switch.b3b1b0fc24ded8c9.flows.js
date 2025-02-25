const Node = {
  "id": "b3b1b0fc24ded8c9",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "dc3f1bccec7ebeb1",
  "name": "All accounts requested?",
  "property": "accountStep",
  "propertyType": "global",
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
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 445,
  "y": 620,
  "wires": [
    [
      "167217baaa7d871c"
    ],
    [
      "2fa6fed0e668bd79"
    ]
  ],
  "outputLabels": [
    "Yes",
    "No"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;