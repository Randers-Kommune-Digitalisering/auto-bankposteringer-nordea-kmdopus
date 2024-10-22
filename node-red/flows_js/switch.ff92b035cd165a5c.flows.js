const Node = {
  "id": "ff92b035cd165a5c",
  "type": "switch",
  "z": "32cf2bec698ca424",
  "g": "54195acebfd77c6b",
  "name": "What is auth status?",
  "property": "adminAuthStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "COMPLETE",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "ACTIVE",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "PENDING",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "RESTARTING",
      "vt": "str"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 5,
  "x": 875,
  "y": 200,
  "wires": [
    [
      "3183105c3c193643"
    ],
    [
      "3183105c3c193643"
    ],
    [
      "be1a01deddfcfba9"
    ],
    [
      "be1a01deddfcfba9"
    ],
    [
      "be1a01deddfcfba9"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;