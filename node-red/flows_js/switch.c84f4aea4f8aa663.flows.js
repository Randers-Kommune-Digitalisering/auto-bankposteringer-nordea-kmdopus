const Node = {
  "id": "c84f4aea4f8aa663",
  "type": "switch",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "What is auth status?",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "COMPLETED",
      "vt": "str"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 1,
  "x": 455,
  "y": 300,
  "wires": [
    [
      "2695f47253a410da"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;