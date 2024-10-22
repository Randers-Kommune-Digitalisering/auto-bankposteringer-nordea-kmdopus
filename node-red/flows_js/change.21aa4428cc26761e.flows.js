const Node = {
  "id": "21aa4428cc26761e",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "fafde89af20cbe51",
  "name": "Set useful transaction parameters",
  "rules": [
    {
      "t": "set",
      "p": "transactionParameters",
      "pt": "flow",
      "to": "[\"narrative\",\"message\",\"counterparty_name\",\"type_description\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 455,
  "y": 100,
  "wires": [
    [
      "73f0b20e54524403"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;