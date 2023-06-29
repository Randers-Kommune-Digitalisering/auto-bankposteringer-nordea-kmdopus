const Node = {
  "id": "0d1b522e31b60979",
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
  "x": 500,
  "y": 1500,
  "wires": [
    [
      "0175fe4415fde518"
    ]
  ],
  "_order": 166
}

module.exports = Node;