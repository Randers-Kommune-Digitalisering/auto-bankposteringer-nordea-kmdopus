const Node = {
  "id": "8f8eb4fa205438c1",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "Set keys",
  "rules": [
    {
      "t": "set",
      "p": "payload.privateKey",
      "pt": "msg",
      "to": "PRIVATEKEY_PEM",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "payload.publicKey",
      "pt": "msg",
      "to": "PUBLICKEY_PEM",
      "tot": "env",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 600,
  "y": 600,
  "wires": [
    [
      "ebe03167109d7c3d"
    ]
  ],
  "_order": 27
}

module.exports = Node;