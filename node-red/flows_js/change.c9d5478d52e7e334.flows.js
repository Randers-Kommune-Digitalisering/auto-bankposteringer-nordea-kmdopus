const Node = {
  "id": "c9d5478d52e7e334",
  "type": "change",
  "z": "2380efc0fb66c87e",
  "g": "7113fec32fd218e0",
  "name": "set request data",
  "rules": [
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
      "p": "data.grant_type",
      "pt": "flow",
      "to": "refresh_token",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "data.refresh_token",
      "pt": "flow",
      "to": "masterData.admSysData.refreshToken",
      "tot": "global"
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
  "y": 340,
  "wires": [
    [
      "0653eecc988d22f9"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;