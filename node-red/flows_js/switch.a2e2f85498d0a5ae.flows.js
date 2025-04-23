const Node = {
  "id": "a2e2f85498d0a5ae",
  "type": "switch",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "What is auth status?",
  "property": "auth.adminStatus",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "CREATED",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "PENDING",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "ACTIVE",
      "vt": "str"
    },
    {
      "t": "eq",
      "v": "EXPIRED",
      "vt": "str"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 4,
  "x": 155,
  "y": 280,
  "wires": [
    [
      "fab3198f3befb8f2"
    ],
    [
      "976e684d62356aad"
    ],
    [
      "328b54e7d76b8a40"
    ],
    [
      "9a601a1713654e7f"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;