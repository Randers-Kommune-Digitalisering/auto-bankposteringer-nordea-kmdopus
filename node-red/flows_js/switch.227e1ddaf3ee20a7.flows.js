const Node = {
  "id": "227e1ddaf3ee20a7",
  "type": "switch",
  "z": "30ea9c666c3d34a6",
  "g": "340a8358eb5b957c",
  "name": "hit?",
  "property": "payload[0].bookingDate",
  "propertyType": "msg",
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
  "x": 465,
  "y": 100,
  "wires": [
    [
      "b395a5509ee2a393"
    ],
    [
      "dd82056ab0eaf890"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;