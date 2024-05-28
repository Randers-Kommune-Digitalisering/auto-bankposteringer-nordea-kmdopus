const Node = {
  "id": "c941b27bfad0cab3",
  "type": "switch",
  "z": "c29d7c6ad66794e5",
  "name": "",
  "property": "config.currentRetryAttempt",
  "propertyType": "msg",
  "rules": [
    {
      "t": "gte",
      "v": "1",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 190,
  "y": 100,
  "wires": [
    [
      "b5e18d2d3c70f085"
    ],
    [
      "f19c79a71c51fdac"
    ]
  ]
}

module.exports = Node;