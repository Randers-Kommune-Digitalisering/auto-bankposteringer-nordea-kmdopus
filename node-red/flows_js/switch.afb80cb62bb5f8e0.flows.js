const Node = {
  "id": "afb80cb62bb5f8e0",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "340a8358eb5b957c",
  "name": "",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "COMPLETED",
      "vt": "str"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 1,
  "x": 125,
  "y": 60,
  "wires": [
    [
      "547579249e32e3ec"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;