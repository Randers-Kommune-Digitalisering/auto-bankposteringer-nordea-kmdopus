const Node = {
  "id": "1df022e6daa7b34a",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "18ec65b7f9e9459e",
  "name": "Bank provider?",
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
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 155,
  "y": 240,
  "wires": [
    [
      "40e113723c283e83"
    ],
    []
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;