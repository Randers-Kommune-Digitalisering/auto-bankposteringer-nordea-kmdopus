const Node = {
  "id": "76acee47a15ddcb2",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "name": "Konfigurér mailpåmindelse",
  "rules": [
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "TEST",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "Test",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "to",
      "pt": "msg",
      "to": "csl@randers.dk",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "from",
      "pt": "msg",
      "to": "Fællesoffentlig Bankintegration (FOBI)",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 555,
  "y": 440,
  "wires": [
    [
      "3d358bfa39d156ba"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;