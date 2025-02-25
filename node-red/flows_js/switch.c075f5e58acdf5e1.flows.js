const Node = {
  "id": "c075f5e58acdf5e1",
  "type": "switch",
  "z": "73d7d240a587aa11",
  "name": "",
  "property": "config.retryAttempts",
  "propertyType": "msg",
  "rules": [
    {
      "t": "gte",
      "v": "5",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 305,
  "y": 120,
  "wires": [
    [
      "6ebd13e4597c9b26"
    ],
    [
      "1ad3572aafd0355c"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;