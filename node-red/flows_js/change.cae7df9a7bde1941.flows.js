const Node = {
  "id": "cae7df9a7bde1941",
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
  "x": 500,
  "y": 1500,
  "wires": [
    [
      "cd2c7030773ff19b"
    ]
  ],
  "_order": 156
}

module.exports = Node;