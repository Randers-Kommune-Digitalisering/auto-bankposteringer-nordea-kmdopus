const Node = {
  "id": "e18a99f198df3d2b",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "a7d9b10b639c44bd",
  "name": "did restarted run originally succeed?",
  "property": "runs.originStatusCode",
  "propertyType": "global",
  "rules": [
    {
      "t": "eq",
      "v": "200",
      "vt": "str"
    },
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
  "outputs": 3,
  "x": 555,
  "y": 380,
  "wires": [
    [
      "709c9904ffcbc8fa"
    ],
    [
      "5d3c0507ae1c4bca"
    ],
    [
      "5d3c0507ae1c4bca"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;