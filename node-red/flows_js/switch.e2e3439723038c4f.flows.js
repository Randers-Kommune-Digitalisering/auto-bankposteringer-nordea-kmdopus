const Node = {
  "id": "e2e3439723038c4f",
  "type": "switch",
  "z": "47254dd1b3ed3b06",
  "g": "13c42cab3fa29e38",
  "name": "hit?",
  "property": "payload",
  "propertyType": "msg",
  "rules": [
    {
      "t": "empty"
    },
    {
      "t": "nempty"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 265,
  "y": 260,
  "wires": [
    [
      "df7543171a6bf8ec"
    ],
    [
      "609528ad5421ed71"
    ]
  ],
  "outputLabels": [
    "false",
    "true"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;