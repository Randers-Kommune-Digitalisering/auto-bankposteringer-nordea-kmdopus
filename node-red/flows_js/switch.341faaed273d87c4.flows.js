const Node = {
  "id": "341faaed273d87c4",
  "type": "switch",
  "z": "9b998b2e60b3c784",
  "g": "aa5769a7dca8b6f4",
  "name": "",
  "property": "payload",
  "propertyType": "msg",
  "rules": [
    {
      "t": "eq",
      "v": "Delete",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 645,
  "y": 80,
  "wires": [
    [
      "ddabb3f74b2fc6ac"
    ],
    [
      "ef80d0ad60a69aa1"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;