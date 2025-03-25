const Node = {
  "id": "2acbce8006035a31",
  "type": "switch",
  "z": "32cf2bec698ca424",
  "g": "83692983b416dfd5",
  "name": "manual posting to process?",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "nempty"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 735,
  "y": 620,
  "wires": [
    [
      "28ded5ec5bfc1e4c"
    ],
    [
      "a2d518219b3f9a29"
    ]
  ],
  "outputLabels": [
    "true",
    "false"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;