const Node = {
  "id": "dd5d5abff8bfa46e",
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
  "x": 355,
  "y": 360,
  "wires": [
    [
      "d02f1289b869fe6b"
    ],
    [
      "f39ed81546d8a834"
    ],
    [
      "f39ed81546d8a834"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;