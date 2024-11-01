const Node = {
  "id": "18aafb43c5d7d126",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "23bc0870886393ea",
  "name": "Provider?",
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
  "x": 135,
  "y": 200,
  "wires": [
    [
      "b2f0114ab8da2473"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;