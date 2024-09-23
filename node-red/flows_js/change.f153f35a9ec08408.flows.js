const Node = {
  "id": "f153f35a9ec08408",
  "type": "change",
  "z": "431f85f122b4636d",
  "g": "9af0024f4593b6d8",
  "name": "Konfigurér mailpåmindelse",
  "rules": [
    {
      "t": "set",
      "p": "configs.email.topic",
      "pt": "global",
      "to": "Godkendelse af automatisk bankindlæsning (autogenereret mail)",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "configs.email.payload",
      "pt": "global",
      "to": "Indlæsningen af bankposteringer kræver din godkendelse",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 180,
  "y": 880,
  "wires": [
    [
      "f64d1a568e9a7397"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

module.exports = Node;