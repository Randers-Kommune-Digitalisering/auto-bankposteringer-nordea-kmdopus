const Node = {
  "id": "5f833c0354a371db",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "0bbde93deecce205",
  "name": "Skriv mail",
  "rules": [
    {
      "t": "set",
      "p": "to",
      "pt": "msg",
      "to": "masterData.admEmail",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 165,
  "y": 1140,
  "wires": [
    [
      "7bc90509ca21d4f1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;