const Node = {
  "id": "f8442862197f5a62",
  "type": "change",
  "z": "62eaf4407ee85a3a",
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
  "x": 215,
  "y": 940,
  "wires": [
    [
      "7a169a19e7563608"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;