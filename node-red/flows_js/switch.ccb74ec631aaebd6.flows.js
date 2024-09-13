const Node = {
  "id": "ccb74ec631aaebd6",
  "type": "switch",
  "z": "ee0cf4ce372e2d36",
  "g": "fafde89af20cbe51",
  "name": "All accounts requested?",
  "property": "accountStep",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "0",
      "vt": "num"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "false",
  "repair": false,
  "outputs": 2,
  "x": 565,
  "y": 160,
  "wires": [
    [
      "588edafd604283f6",
      "e4b5680702fbfb57"
    ],
    [
      "d833516eacb80991"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;