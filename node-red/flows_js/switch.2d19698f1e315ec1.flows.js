const Node = {
  "id": "2d19698f1e315ec1",
  "type": "switch",
  "z": "a1dc9966e881ac6b",
  "g": "68f21991ad3e5be0",
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
  "y": 80,
  "wires": [
    [
      "9aeee570659d9e00"
    ],
    [
      "6db1ca842c6385e3"
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