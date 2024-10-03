const Node = {
  "id": "58b540bd1c41656c",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "622bd279325fcb5d",
  "name": "",
  "property": "configs.banking.provider",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "Nordea",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 165,
  "y": 100,
  "wires": [
    [
      "5209c433dde5cd5e"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;