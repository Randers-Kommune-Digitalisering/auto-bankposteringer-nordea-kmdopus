const Node = {
  "id": "ed2d6ae563bf7648",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "a40dda636245513b",
  "name": "Sæt værdier",
  "rules": [
    {
      "t": "set",
      "p": "payload.ruleID",
      "pt": "msg",
      "to": "($globalContext(\"masterData\").rules.ruleID ~> $max() ) + 1",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 195,
  "y": 580,
  "wires": [
    [
      "7de4c1a43d6ebdb4"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;