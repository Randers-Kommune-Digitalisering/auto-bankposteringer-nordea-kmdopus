const Node = {
  "id": "d9a0609727ed6375",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "c31ca42d52037078",
  "name": "switch req status",
  "property": "statusCode",
  "propertyType": "msg",
  "rules": [
    {
      "t": "btwn",
      "v": "200",
      "vt": "num",
      "v2": "201",
      "v2t": "num"
    },
    {
      "t": "eq",
      "v": "401",
      "vt": "num"
    },
    {
      "t": "btwn",
      "v": "400",
      "vt": "num",
      "v2": "510",
      "v2t": "num"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 1490,
  "y": 180,
  "wires": [
    [
      "87538fe934f3a5c9"
    ],
    [
      "b5e0f0f808716c5f",
      "d194eda7b9db38ed"
    ],
    [
      "b5e0f0f808716c5f"
    ]
  ]
}

module.exports = Node;