const Node = {
  "id": "58f4d806f973a531",
  "type": "switch",
  "z": "8c354b8d2ca56b7b",
  "g": "9b2beb35be5bbb31",
  "name": "Bank provider",
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
  "x": 585,
  "y": 460,
  "wires": [
    [
      "99c8856eb2f4cc6f"
    ]
  ],
  "outputLabels": [
    "Nordea"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;