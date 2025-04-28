const Node = {
  "id": "994801c4cd409d44",
  "type": "switch",
  "z": "88c6307a5ee1dd81",
  "g": "54ef3083f50853f1",
  "name": "Manual transactions",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "istype",
      "v": "undefined",
      "vt": "undefined"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 305,
  "y": 80,
  "wires": [
    [
      "85ebf58680e4023c"
    ],
    [
      "7ad0f237d1476780"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;