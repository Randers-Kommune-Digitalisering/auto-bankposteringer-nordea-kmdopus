const Node = {
  "id": "8ab1869e42b9c599",
  "type": "change",
  "z": "b4538e068dada71f",
  "g": "d32626a8dedb1de3",
  "name": "Setup",
  "rules": [
    {
      "t": "set",
      "p": "host",
      "pt": "msg",
      "to": "DB_HOST",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "port",
      "pt": "msg",
      "to": "DB_PORT",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "database",
      "pt": "msg",
      "to": "DB_DATABASE",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "username",
      "pt": "msg",
      "to": "DB_USER",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "password",
      "pt": "msg",
      "to": "DB_PASS",
      "tot": "env",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 145,
  "y": 100,
  "wires": [
    [
      "a2a37e4b5b7325d3"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;