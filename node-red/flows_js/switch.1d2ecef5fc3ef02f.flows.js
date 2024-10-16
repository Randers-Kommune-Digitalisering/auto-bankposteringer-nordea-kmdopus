const Node = {
  "id": "1d2ecef5fc3ef02f",
  "type": "switch",
  "z": "62eaf4407ee85a3a",
  "g": "ee31b70d7b508c0d",
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
  "x": 185,
  "y": 80,
  "wires": [
    [
      "191c2efe5a159a6e"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;