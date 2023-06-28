const Node = {
  "id": "e6b520f4c062a924",
  "type": "switch",
  "z": "0bc16db685bd2e6a",
  "name": "",
  "property": "payload.request",
  "propertyType": "msg",
  "rules": [
    {
      "t": "eq",
      "v": "getPublicKey",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "uploadData",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 410,
  "y": 420,
  "wires": [
    [
      "aa7509d32bbd6a28"
    ],
    [
      "85de60ed3c367397"
    ]
  ],
  "_order": 127
}

module.exports = Node;