const Node = {
  "id": "ac7fa2e4b738f29b",
  "type": "switch",
  "z": "6a990ac4b4acd1b6",
  "name": "error?",
  "property": "error",
  "propertyType": "msg",
  "rules": [
    {
      "t": "istype",
      "v": "object",
      "vt": "object"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 280,
  "y": 180,
  "wires": [
    [
      "f2355f41864cdc9f"
    ]
  ]
}

module.exports = Node;