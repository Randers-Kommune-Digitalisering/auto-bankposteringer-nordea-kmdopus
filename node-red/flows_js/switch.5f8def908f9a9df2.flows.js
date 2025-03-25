const Node = {
  "id": "5f8def908f9a9df2",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "622bd279325fcb5d",
  "name": "erpSystem",
  "property": "masterData.admSysData.erpSystem",
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
  "x": 405,
  "y": 220,
  "wires": [
    [
      "f2f122a419822663"
    ],
    [
      "1cb30d9c35c5b10f"
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