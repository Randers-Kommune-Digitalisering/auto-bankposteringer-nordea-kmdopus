const Node = {
  "id": "fc46da1ec87b6916",
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
  "y": 140,
  "wires": [
    [
      "bdfab25036118588"
    ]
  ],
  "_order": 166
}

module.exports = Node;