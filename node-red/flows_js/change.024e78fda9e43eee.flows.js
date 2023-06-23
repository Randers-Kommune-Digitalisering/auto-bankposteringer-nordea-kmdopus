const Node = {
  "id": "024e78fda9e43eee",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "Set environment variables",
  "rules": [
    {
      "t": "set",
      "p": "eidasPrivateKey",
      "pt": "flow",
      "to": "EIDASPRIVATEKEY",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "X-IBM-Client-Id",
      "pt": "flow",
      "to": "CLIENT_ID",
      "tot": "env",
      "dc": true
    },
    {
      "t": "set",
      "p": "X-IBM-Client-Secret",
      "pt": "msg",
      "to": "CLIENT_SECRET",
      "tot": "env",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 330,
  "y": 100,
  "wires": [
    [
      "473899a206c1da21"
    ]
  ],
  "_order": 17
}

module.exports = Node;