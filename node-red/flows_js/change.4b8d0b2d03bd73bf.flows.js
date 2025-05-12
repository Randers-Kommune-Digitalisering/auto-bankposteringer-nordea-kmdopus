const Node = {
  "id": "4b8d0b2d03bd73bf",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "54ef3083f50853f1",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "encoding",
      "pt": "msg",
      "to": "utf8",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "erp.formattedPostings",
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
  "x": 255,
  "y": 80,
  "wires": [
    [
      "994801c4cd409d44"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;