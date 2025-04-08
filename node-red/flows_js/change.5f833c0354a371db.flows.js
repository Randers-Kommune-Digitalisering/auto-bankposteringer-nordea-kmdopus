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
      "to": "masterData.admSysData.admEmail",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "from",
      "pt": "msg",
      "to": "SENDER_ADRESS",
      "tot": "env"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "configs.reminder.topic",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "configs.reminder.payload",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 295,
  "y": 660,
  "wires": [
    [
      "7bc90509ca21d4f1"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;