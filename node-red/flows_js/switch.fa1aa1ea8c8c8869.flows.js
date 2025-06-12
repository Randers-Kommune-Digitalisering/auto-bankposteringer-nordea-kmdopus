const Node = {
  "id": "fa1aa1ea8c8c8869",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "25a291d67b31ccca",
  "name": "manual posting to process?",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "istype",
      "v": "undefined",
      "vt": "undefined"
    },
    {
      "t": "empty"
    },
    {
      "t": "nempty"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 105,
  "y": 1040,
  "wires": [
    [
      "f4e0040b386fade6"
    ],
    [
      "f4e0040b386fade6"
    ],
    [
      "225810e12abada52"
    ]
  ],
  "outputLabels": [
    "",
    "false",
    "true"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;