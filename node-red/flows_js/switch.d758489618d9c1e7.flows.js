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
  "x": 505,
  "y": 200,
  "wires": [
    [
      "076e9bdf1e6b6059"
    ],
    [
      "f2f122a419822663"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;