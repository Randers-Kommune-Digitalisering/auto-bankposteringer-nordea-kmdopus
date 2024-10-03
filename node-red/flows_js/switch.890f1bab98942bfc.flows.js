const Node = {
  "id": "890f1bab98942bfc",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "622bd279325fcb5d",
  "name": "Integration to ØS?",
  "property": "masterData.integrationBool",
  "propertyType": "global",
  "rules": [
    {
      "t": "true"
    },
    {
      "t": "false"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 115,
  "y": 80,
  "wires": [
    [
      "84f96049f46a03fd"
    ],
    [
      "58b540bd1c41656c"
    ]
  ],
  "outputLabels": [
    "Yes",
    "No"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;