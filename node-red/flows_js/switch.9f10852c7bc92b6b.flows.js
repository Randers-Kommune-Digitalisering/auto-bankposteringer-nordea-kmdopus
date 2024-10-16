const Node = {
  "id": "9f10852c7bc92b6b",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "53bef385de58a8a2",
  "name": "Has auth been manually restarted?",
  "property": "authRestart",
  "propertyType": "global",
  "rules": [
    {
      "t": "true"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 115,
  "y": 1420,
  "wires": [
    [
      "60026b015a6bdea9"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;