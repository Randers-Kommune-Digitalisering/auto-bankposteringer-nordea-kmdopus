const Node = {
  "id": "323ea54022b90776",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "a40dda636245513b",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$globalContext(\"masterData\").rules[ruleID = $$.uid]",
      "tot": "jsonata",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 245,
  "y": 460,
  "wires": [
    [
      "52b67364a4b05ead"
    ]
  ],
  "icon": "font-awesome/fa-filter",
  "l": false
}

module.exports = Node;