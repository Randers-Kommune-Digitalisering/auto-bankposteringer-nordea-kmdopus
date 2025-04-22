const Node = {
  "id": "65f05fd95afd6207",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "set request data",
  "rules": [
    {
      "t": "set",
      "p": "step",
      "pt": "flow",
      "to": "4",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "method",
      "pt": "flow",
      "to": "POST",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "path",
      "pt": "flow",
      "to": "/corporate/v2/authorize/token",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "content-type",
      "pt": "flow",
      "to": "application/x-www-form-urlencoded",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "data.code",
      "pt": "flow",
      "to": "masterData.admSysData.accessToken",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "data.grant_type",
      "pt": "flow",
      "to": "authorization_code",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "url",
      "pt": "msg",
      "to": "$globalContext(\"configs\").banking.domain & $flowContext(\"path\")",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 255,
  "y": 300,
  "wires": [
    [
      "6a50b9406db5c815"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;