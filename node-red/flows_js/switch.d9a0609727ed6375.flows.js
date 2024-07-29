const Node = {
  "id": "d9a0609727ed6375",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "c31ca42d52037078",
  "name": "Check status code from API response",
  "property": "statusCode",
  "propertyType": "msg",
  "rules": [
    {
      "t": "eq",
      "v": "409",
      "vt": "num"
    },
    {
      "t": "btwn",
      "v": "400",
      "vt": "num",
      "v2": "499",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "500",
      "vt": "num",
      "v2": "599",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "200",
      "vt": "num",
      "v2": "299",
      "v2t": "num"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 4,
  "x": 115,
  "y": 240,
  "wires": [
    [
      "51f81d4692d31edf"
    ],
    [
      "3e5f20be354ae3bd"
    ],
    [
      "3e5f20be354ae3bd"
    ],
    [
      "87538fe934f3a5c9"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;