const Node = {
  "id": "d2595898600c160a",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "manual postings?",
  "property": "transactions.manual",
  "propertyType": "global",
  "rules": [
    {
      "t": "istype",
      "v": "undefined",
      "vt": "undefined"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 2,
  "x": 555,
  "y": 200,
  "wires": [
    [
      "124c0d3fd352bd92"
    ],
    [
      "be65729dd0f21f9b"
    ]
  ],
  "outputLabels": [
    "true",
    "false"
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;