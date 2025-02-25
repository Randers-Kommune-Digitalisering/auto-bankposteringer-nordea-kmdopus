const Node = {
  "id": "5b6bc885ec99dce4",
  "type": "change",
  "z": "6a990ac4b4acd1b6",
  "g": "462d0bdf904f6d70",
  "name": "clean",
  "rules": [
    {
      "t": "delete",
      "p": "host",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "port",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "database",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "username",
      "pt": "msg"
    },
    {
      "t": "delete",
      "p": "password",
      "pt": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 235,
  "y": 100,
  "wires": [
    [
      "4ffc22bb5fb41254"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

module.exports = Node;