const Node = {
  "id": "54bfce6c5e422ed6",
  "type": "switch",
  "z": "2380efc0fb66c87e",
  "g": "73b9b3deaf04ef3b",
  "name": "What is auth status?",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "EXPIRED",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 655,
  "y": 460,
  "wires": [
    [
      "9d33be9522a2ba30"
    ],
    [
      "fefac7c4522ad10f"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;