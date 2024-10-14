const Node = {
  "id": "b3b1b0fc24ded8c9",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
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
  "x": 165,
  "y": 1020,
  "wires": [
    [
      "b203dd24d5bb3b76"
    ],
    [
      "2efe55213bd0cbc7"
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