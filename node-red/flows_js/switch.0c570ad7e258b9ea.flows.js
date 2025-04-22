const Node = {
  "id": "0c570ad7e258b9ea",
  "type": "switch",
  "z": "0715142e73ad87d8",
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
      "cb6650ce76904a8d"
    ],
    [
      "3fb807b34fa48220"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;