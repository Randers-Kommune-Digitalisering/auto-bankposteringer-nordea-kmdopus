const Node = {
  "id": "597ce6738ff77bef",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "9f5e7f69a9319c00",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "continuation_key",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "add_transactions",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1125,
  "y": 280,
  "wires": [
    [
      "3bf0fcec8ac96b0c"
    ]
  ],
  "l": false
}

module.exports = Node;