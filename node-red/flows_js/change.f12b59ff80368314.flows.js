const Node = {
  "id": "f12b59ff80368314",
  "type": "change",
  "z": "62eaf4407ee85a3a",
  "g": "af45fb910a71600f",
  "name": "Konfigurér mailpåmindelse",
  "rules": [
    {
      "t": "set",
      "p": "accessDurationDays",
      "pt": "flow",
      "to": "$floor($flowContext(\"accessDuration\") / 60 / 24)",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "topic",
      "pt": "msg",
      "to": "Påmindelse - Autorisation af FOBI ",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "\"Der er nu \" & $flowContext(\"accessDurationDays\") & \" dage tilbage af autorisation af automatisk bankindlæsning (FOBI)\"",
      "tot": "jsonata"
    },
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
  "y": 760,
  "wires": [
    [
      "502bdf88354d036b"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;