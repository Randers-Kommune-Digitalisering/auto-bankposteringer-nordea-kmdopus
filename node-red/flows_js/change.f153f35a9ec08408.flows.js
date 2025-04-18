const Node = {
  "id": "f153f35a9ec08408",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "865ca641c6246507",
  "name": "Konfigurér mailpåmindelse",
  "rules": [
    {
      "t": "set",
      "p": "configs.reminder.topic",
      "pt": "global",
      "to": "Godkendelse af automatisk bankindlæsning (autogenereret mail)",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.reminder.payload",
      "pt": "global",
      "to": "Indlæsningen af bankposteringer kræver din godkendelse",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.reminder.sender",
      "pt": "global",
      "to": "SENDER_ADRESS",
      "tot": "env"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 220,
  "y": 220,
  "wires": [
    [
      "a5bf1fc2e8c7a32d"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;