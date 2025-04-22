const Node = {
  "id": "ef07562d41758e70",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "set request data",
  "rules": [
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "GET",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "urlParam",
      "pt": "flow",
      "to": "auth.accessId",
      "tot": "global"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 260,
  "wires": [
    [
      "9566c76a608cd913"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;