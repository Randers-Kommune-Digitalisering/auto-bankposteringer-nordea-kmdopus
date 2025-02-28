const Node = {
  "id": "f12b59ff80368314",
  "type": "change",
  "z": "8c354b8d2ca56b7b",
  "g": "af45fb910a71600f",
  "name": "Konfigurér mailpåmindelse",
  "rules": [
    {
      "t": "set",
      "p": "accessDurationDays",
      "pt": "global",
      "to": "$floor($globalContext(\"accessDuration\") / 60 / 24)",
      "tot": "jsonata"
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
    },
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
  "x": 155,
  "y": 620,
  "wires": [
    [
      "c966227c3ab9b9de"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;