const Node = {
  "id": "f153f35a9ec08408",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
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
      "pt": "msg",
      "to": "Indlæsningen af bankposteringer kræver din godkendelse",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 200,
  "y": 380,
  "wires": [
    [
      "12b79b33b84ebcc0"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;