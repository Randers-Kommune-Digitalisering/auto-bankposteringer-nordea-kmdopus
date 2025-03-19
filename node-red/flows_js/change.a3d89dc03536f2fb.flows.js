const Node = {
  "id": "a3d89dc03536f2fb",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "202a6b173abfc606",
  "name": "Set useful transaction parameters",
  "rules": [
    {
      "t": "set",
      "p": "transactions.parameters",
      "pt": "global",
      "to": "[[\"narrative\",\"message\"],\"counterparty_name\",\"type_description\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 615,
  "y": 60,
  "wires": [
    [
      "da9d0b8038e2bfe1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;