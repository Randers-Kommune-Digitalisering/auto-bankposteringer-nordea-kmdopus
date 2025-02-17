const Node = {
  "id": "5f833c0354a371db",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "0bbde93deecce205",
  "name": "Skriv mail",
  "rules": [
    {
      "t": "set",
      "p": "to",
      "pt": "msg",
      "to": "masterData.admEmail",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "from",
      "pt": "msg",
      "to": "SENDER_ADRESS",
      "tot": "env"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 445,
  "y": 740,
  "wires": [
    [
      "7bc90509ca21d4f1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;