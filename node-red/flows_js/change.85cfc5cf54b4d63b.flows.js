const Node = {
  "id": "85cfc5cf54b4d63b",
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
  "y": 640,
  "wires": [
    [
      "d9efe856a3a7ba1b"
    ]
  ],
  "_order": 124
}

module.exports = Node;