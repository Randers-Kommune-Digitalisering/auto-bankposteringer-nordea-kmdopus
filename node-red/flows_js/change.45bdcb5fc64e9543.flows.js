const Node = {
  "id": "45bdcb5fc64e9543",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "Clean up globlal.transactions",
  "rules": [
    {
      "t": "delete",
      "p": "transactions.manual",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 955,
  "y": 220,
  "wires": [
    [
      "76c02b9387861543"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;