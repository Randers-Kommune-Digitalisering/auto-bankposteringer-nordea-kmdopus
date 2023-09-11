const Node = {
  "id": "6f5d7cef733eca4d",
  "type": "change",
  "z": "0b526691b09a2646",
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
  "y": 280,
  "wires": [
    [
      "0cd6b00f06951c36"
    ]
  ],
  "_order": 54
}

module.exports = Node;