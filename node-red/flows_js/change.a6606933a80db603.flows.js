const Node = {
  "id": "a6606933a80db603",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "b9fd86e23e147a4d",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "headers",
      "pt": "msg",
      "to": "{}",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "headers.Content-Type",
      "pt": "msg",
      "to": "application/json",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.Content-Disposition",
      "pt": "msg",
      "to": "attachment; filename=konteringsregler.json",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "masterData.rules",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 685,
  "y": 220,
  "wires": [
    [
      "de9f6445740b3567"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;