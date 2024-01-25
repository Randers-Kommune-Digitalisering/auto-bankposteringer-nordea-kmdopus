const Node = {
  "id": "6f5d7cef733eca4d",
  "type": "change",
  "z": "5a8afc5afb89916f",
  "g": "f51cc7b4f0bee577",
  "name": "params",
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
      "to": "authorization_code",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "data.code",
      "pt": "flow",
      "to": "exchange_code",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "step",
      "pt": "global",
      "to": "4",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 620,
  "y": 180,
  "wires": [
    [
      "aee96e58617e7c46"
    ]
  ],
  "_order": 174
}

module.exports = Node;