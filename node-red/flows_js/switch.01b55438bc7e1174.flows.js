const Node = {
  "id": "01b55438bc7e1174",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "28fa0d73a52eaed0",
  "name": "All accounts requested?",
  "property": "transactions.accountStep",
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
  "x": 345,
  "y": 380,
  "wires": [
    [
      "1294b96375ad866f"
    ],
    [
      "3b13e835e254461b"
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