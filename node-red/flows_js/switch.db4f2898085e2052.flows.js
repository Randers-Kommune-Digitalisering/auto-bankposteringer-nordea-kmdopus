const Node = {
  "id": "db4f2898085e2052",
  "type": "switch",
  "z": "92c28da6a66fdcb3",
  "g": "82c2533175513d9e",
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
      "t": "eq",
      "v": "Fujitsu Prisme",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "ØS Indsigt",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 105,
  "y": 820,
  "wires": [
    [
      "4e59af6cb0cce7a6"
    ],
    [
      "8ddd975318cc2dd3"
    ],
    [
      "828c48e47c3971df"
    ]
  ],
  "outputLabels": [
    "KMD",
    "Fujitsu",
    "EG"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;