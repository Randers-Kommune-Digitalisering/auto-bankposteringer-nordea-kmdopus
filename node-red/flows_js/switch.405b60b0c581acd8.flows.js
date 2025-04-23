const Node = {
  "id": "405b60b0c581acd8",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
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
      "1058bf9602a0ba3f"
    ],
    [
      "22afd54fd018d590"
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