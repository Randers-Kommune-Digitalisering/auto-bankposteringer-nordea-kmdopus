const Node = {
  "id": "2ad44a86778872d1",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "1c9d2e5a1088096c",
  "name": "",
  "property": "masterData.erpSystem",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "KMD Opus",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 115,
  "y": 220,
  "wires": [
    [
      "ffaf5565c469e046"
    ],
    [
      "bb072cb72c297215"
    ]
  ],
  "outputLabels": [
    "KMD Opus",
    ""
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;