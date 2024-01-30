const Node = {
  "id": "31c1b0b29c6e3426",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
  "name": "Auth expired",
  "property": "list_http_code",
  "propertyType": "flow",
  "rules": [
    {
      "t": "eq",
      "v": "401",
      "vt": "num"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 250,
  "y": 100,
  "wires": [
    [
      "e4d850011ccad60f"
    ]
  ],
  "_order": 191
}

module.exports = Node;