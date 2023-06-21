const Node = {
  "id": "e88d07205354b450",
  "type": "change",
  "z": "257592181f6612d1",
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
      "23e5a4db82793153"
    ]
  ],
  "_order": 141
}

module.exports = Node;