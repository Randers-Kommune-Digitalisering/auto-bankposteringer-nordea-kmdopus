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
      "t": "btwn",
      "v": "400",
      "vt": "num",
      "v2": "499",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "200",
      "vt": "num",
      "v2": "299",
      "v2t": "num"
    },
    {
      "t": "btwn",
      "v": "500",
      "vt": "num",
      "v2": "599",
      "v2t": "num"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 105,
  "y": 200,
  "wires": [
    [
      "98fb9a12ea6f964c"
    ],
    [
      "87538fe934f3a5c9"
    ],
    [
      "252967e851662761"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;