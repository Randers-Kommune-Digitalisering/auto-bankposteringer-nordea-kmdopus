const Node = {
  "id": "79d7d1f46596ab60",
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
  "y": 1080,
  "wires": [
    [
      "4125413156bb3723"
    ]
  ],
  "_order": 152
}

module.exports = Node;