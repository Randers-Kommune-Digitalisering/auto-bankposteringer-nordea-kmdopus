const Node = {
  "id": "1294b96375ad866f",
  "type": "change",
  "z": "30ea9c666c3d34a6",
  "g": "28fa0d73a52eaed0",
  "name": "Clean up globlal.transactions",
  "rules": [
    {
      "t": "delete",
      "p": "transactions.continuationKey",
      "pt": "global"
    },
    {
      "t": "delete",
      "p": "transactions.add",
      "pt": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 395,
  "y": 360,
  "wires": [
    [
      "3ecf30ab26092ccd",
      "f87c3b578646101c"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;