const Node = {
  "id": "be81b976e775bce6",
  "type": "change",
  "z": "0a57a34536934723",
  "g": "b9fd86e23e147a4d",
  "name": "Add rule.accountTertiary if not present",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "req.files[0].buffer",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$map(\t   payload,\t   function($v, $i, $a) {\t       $v.accountTertiary ? $v : $merge([$v, {\"accountTertiary\": null}]) \t   }\t)",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "masterData.rules",
      "pt": "global",
      "to": "payload",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 735,
  "y": 260,
  "wires": [
    [
      "a979f58bc601a803"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;