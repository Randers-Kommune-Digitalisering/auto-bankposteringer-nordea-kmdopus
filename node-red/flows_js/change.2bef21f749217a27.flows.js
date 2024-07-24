const Node = {
  "id": "2bef21f749217a27",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "d6d5f4ec783b7505",
  "name": "Skriv mail",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "Indlæsningen af bankposteringer kræver din godkendelse",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "Godkendelse af automatisk bankindlæsning (autogenereret mail)",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "to",
      "pt": "msg",
      "to": "admEmail",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "adminAuthAttempt",
      "pt": "global",
      "to": "0",
      "tot": "num"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 145,
  "y": 340,
  "wires": [
    [
      "c9b71d6eea7c0ed6"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;