const Node = {
  "id": "fc00c4f8314e94b3",
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
  "y": 140,
  "wires": [
    [
      "0c74d36d5acc58f9"
    ]
  ],
  "_order": 136
}

module.exports = Node;