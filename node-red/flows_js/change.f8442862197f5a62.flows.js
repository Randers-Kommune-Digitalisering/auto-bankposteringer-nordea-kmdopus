const Node = {
  "id": "f8442862197f5a62",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "be3c4fb5b3ea916b",
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
  "x": 845,
  "y": 300,
  "wires": [
    [
      "a1f41777ba5459a4",
      "7a169a19e7563608"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;