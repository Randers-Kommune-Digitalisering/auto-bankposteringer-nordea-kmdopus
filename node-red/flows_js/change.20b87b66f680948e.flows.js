const Node = {
  "id": "20b87b66f680948e",
  "type": "change",
  "z": "ac21bbbed3962f80",
  "g": "977504c173614784",
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
  "x": 240,
  "y": 220,
  "wires": [
    [
      "ecf3ea884fc61182"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;