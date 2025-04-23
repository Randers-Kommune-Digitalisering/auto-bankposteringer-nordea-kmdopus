const Node = {
  "id": "a4b58fbdee95b692",
  "type": "switch",
  "z": "b4538e068dada71f",
  "name": "is JSON?",
  "property": "payload",
  "propertyType": "msg",
  "rules": [
    {
      "t": "istype",
      "v": "json",
      "vt": "json"
    },
    {
      "t": "istype",
      "v": "object",
      "vt": "object"
    },
    {
      "t": "else"
    }
  ],
  "checkall": "true",
  "repair": false,
  "outputs": 3,
  "x": 315,
  "y": 100,
  "wires": [
    [
      "b57ed2308d5c9f4d"
    ],
    [
      "7b1c10e50364552e"
    ],
    [
      "1da0912604b2c4fc"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;