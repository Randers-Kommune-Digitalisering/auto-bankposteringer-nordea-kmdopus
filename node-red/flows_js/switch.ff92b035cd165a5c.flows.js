const Node = {
  "id": "ff92b035cd165a5c",
  "type": "switch",
  "z": "32cf2bec698ca424",
  "g": "54195acebfd77c6b",
  "name": "What is auth status?",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "FAILED",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 855,
  "y": 100,
  "wires": [
    [
      "3183105c3c193643"
    ],
    [
      "be1a01deddfcfba9"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;