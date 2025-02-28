const Node = {
  "id": "f8442862197f5a62",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "dc3f1bccec7ebeb1",
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
  "x": 395,
  "y": 440,
  "wires": [
    [
      "9ad5392beeb7a718"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;