const Node = {
  "id": "f04f709f338fbe3e",
  "type": "switch",
  "z": "37f6db37c66da295",
  "g": "9d7a704133314cab",
  "name": "What is request status?",
  "property": "adminAuthStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "FAILED",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "ACTIVE",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 3,
  "x": 115,
  "y": 480,
  "wires": [
    [
      "6bd20ea51ec743b1"
    ],
    [
      "1f3af8f024b5a8bb"
    ],
    [
      "302deede66edf3b7"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;