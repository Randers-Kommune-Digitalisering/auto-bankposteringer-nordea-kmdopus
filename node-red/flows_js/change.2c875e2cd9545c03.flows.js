const Node = {
  "id": "2c875e2cd9545c03",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "uuid",
      "pt": "global",
      "to": "\"{\\\"uuid\\\": \\\"require('uuid')\\\"}\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "moment",
      "pt": "global",
      "to": "\"{\\\"moment\\\": \\\"require('moment')\\\"}\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "forge",
      "pt": "global",
      "to": "\"{\\\"forge\\\": \\\"require('forge')\\\"}\"",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "sdk",
      "pt": "global",
      "to": "\"{\\\"sdk\\\": \\\"require('sdk')\\\"}\"",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 280,
  "y": 80,
  "wires": [
    []
  ],
  "_order": 18
}

module.exports = Node;