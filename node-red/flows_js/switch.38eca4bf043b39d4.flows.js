const Node = {
  "id": "38eca4bf043b39d4",
  "type": "switch",
  "z": "47254dd1b3ed3b06",
  "g": "b2a2686e2a92b35e",
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
  "x": 705,
  "y": 260,
  "wires": [
    [
      "8f3edbeae54c6003"
    ],
    [
      "47010aa01f2a85fb"
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