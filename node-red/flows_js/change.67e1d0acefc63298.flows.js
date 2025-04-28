const Node = {
  "id": "67e1d0acefc63298",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "0fc5db670402470f",
  "name": "Build msg",
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
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 220,
  "wires": [
    [
      "534a9c275b564099"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;