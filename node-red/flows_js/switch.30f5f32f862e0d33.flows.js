const Node = {
  "id": "30f5f32f862e0d33",
  "type": "switch",
  "z": "c29d7c6ad66794e5",
  "name": "",
  "property": "config.currentRetryAttempt",
  "propertyType": "msg",
  "rules": [
    {
      "t": "lte",
      "v": "config.retryAttempts",
      "vt": "msg"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 630,
  "y": 100,
  "wires": [
    [],
    []
  ]
}

module.exports = Node;