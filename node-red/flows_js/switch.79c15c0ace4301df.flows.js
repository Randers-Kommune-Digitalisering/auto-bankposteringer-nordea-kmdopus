const Node = {
  "id": "79c15c0ace4301df",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "manual postings?",
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
  "x": 705,
  "y": 400,
  "wires": [
    [
      "56f2fa5975d90d08"
    ],
    [
      "56f2fa5975d90d08"
    ],
    [
      "56f2fa5975d90d08"
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