const Node = {
  "id": "96a12fc03316b926",
  "type": "switch",
  "z": "47254dd1b3ed3b06",
  "g": "bd1a9dc1db99156a",
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
  "x": 995,
  "y": 260,
  "wires": [
    [
      "cfd5f81d36b1fd06"
    ],
    [
      "2506381ac5a8330b"
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