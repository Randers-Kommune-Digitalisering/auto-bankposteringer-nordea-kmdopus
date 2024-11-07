const Node = {
  "id": "1e8bb3060af60921",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "c9e7ab8a728c987d",
  "name": "Provider?",
  "property": "configs.banking.provider",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "Nordea",
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
  "y": 360,
  "wires": [
    [
      "3f347f4442b5cd54"
    ],
    [
      "d564e1258605dc5d"
    ]
  ],
  "outputLabels": [
    "Nordea",
    null
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;