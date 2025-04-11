const Node = {
  "id": "d758489618d9c1e7",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "622bd279325fcb5d",
  "name": "Integration to ØS?",
  "property": "masterData.admSysData.integrationBool",
  "propertyType": "global",
  "rules": [
    {
      "t": "false"
    },
    {
      "t": "true"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 705,
  "y": 240,
  "wires": [
    [
      "ce6e75a363bb80b0"
    ],
    [
      "86f72d66ea33305f"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;