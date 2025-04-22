const Node = {
  "id": "8b921406f1c88666",
  "type": "switch",
  "z": "0a57a34536934723",
  "g": "f5b0f2cb9d251540",
  "name": "manual posting to process?",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "nempty"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 1125,
  "y": 180,
  "wires": [
    [
      "02c9a49c9a580c08"
    ],
    [
      "1ae55ae91ab4dbf4"
    ]
  ],
  "outputLabels": [
    "true",
    "false"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;