const Node = {
  "id": "da9b19575a4a50df",
  "type": "change",
  "z": "e37c26303529a6e8",
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
  "x": 520,
  "y": 640,
  "wires": [
    [
      "02df18056dda2921"
    ]
  ],
  "_order": 119
}

module.exports = Node;