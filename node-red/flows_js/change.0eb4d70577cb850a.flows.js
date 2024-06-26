const Node = {
  "id": "0eb4d70577cb850a",
  "type": "change",
  "z": "37f6db37c66da295",
  "g": "fa9c0eb18149dc68",
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
      "p": "url",
      "pt": "msg",
      "to": "$flowContext(\"domain\") & $flowContext(\"path\")",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 595,
  "y": 180,
  "wires": [
    [
      "7a7b99685c649752"
    ]
  ],
  "icon": "font-awesome/fa-cogs",
  "l": false
}

module.exports = Node;