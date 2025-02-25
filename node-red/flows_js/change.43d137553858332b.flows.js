const Node = {
  "id": "43d137553858332b",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "name": "Creds",
  "rules": [
    {
      "t": "set",
      "p": "host",
      "pt": "msg",
      "to": "SFTP_URL",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "user",
      "pt": "msg",
      "to": "SFTP_USER",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "password",
      "pt": "msg",
      "to": "SFTP_PASS",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "port",
      "pt": "msg",
      "to": "22",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 570,
  "y": 480,
  "wires": [
    [
      "90c9d21948cf0896"
    ]
  ]
}

module.exports = Node;