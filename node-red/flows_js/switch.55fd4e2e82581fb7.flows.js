const Node = {
  "id": "55fd4e2e82581fb7",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "25a291d67b31ccca",
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
  "x": 105,
  "y": 720,
  "wires": [
    [
      "225810e12abada52"
    ],
    [
      "f4e0040b386fade6"
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