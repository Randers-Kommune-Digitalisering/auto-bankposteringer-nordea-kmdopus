const Node = {
  "id": "f8442862197f5a62",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "9f0acbcfa0581c4a",
  "name": "Delete vars",
  "rules": [
    {
      "t": "delete",
      "p": "continuation_key",
      "pt": "flow"
    },
    {
      "t": "delete",
      "p": "addTransactions",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 205,
  "y": 480,
  "wires": [
    [
      "a445693334ae4264"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;