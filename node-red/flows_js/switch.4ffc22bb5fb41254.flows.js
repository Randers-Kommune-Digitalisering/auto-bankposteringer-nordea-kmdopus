const Node = {
  "id": "4ffc22bb5fb41254",
  "type": "switch",
  "z": "6a990ac4b4acd1b6",
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
      "651379f63fd851d5"
    ],
    [
      "8114247316d2adf3"
    ],
    [
      "386522f404a71aca"
    ]
  ],
  "icon": "font-awesome/fa-question",
  "l": false
}

module.exports = Node;