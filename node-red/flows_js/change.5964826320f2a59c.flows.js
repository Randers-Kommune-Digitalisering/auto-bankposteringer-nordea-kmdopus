const Node = {
  "id": "5964826320f2a59c",
  "type": "change",
  "z": "31641b084096a0df",
  "g": "19850c032bac1ad9",
  "name": "Set headers og data fra flow til msg",
  "rules": [
    {
      "t": "set",
      "p": "headers",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "headers.Content-Type",
      "pt": "msg",
      "to": "Content-Type",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.Signature",
      "pt": "msg",
      "to": "Signature",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.Digest",
      "pt": "msg",
      "to": "Digest",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.X-Nordea-Originating-Date",
      "pt": "msg",
      "to": "X-Nordea-Originating-Date",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.X-Nordea-Originating-Host",
      "pt": "msg",
      "to": "X-Nordea-Originating-Host",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.X-IBM-Client-Id",
      "pt": "msg",
      "to": "X-IBM-Client-Id",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "url",
      "pt": "msg",
      "to": "url",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.X-IBM-Client-Secret",
      "pt": "msg",
      "to": "X-IBM-Client-Secret",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "data",
      "tot": "flow"
    },
    {
      "t": "set",
      "p": "headers.Authorization",
      "pt": "msg",
      "to": "'Bearer ' & $globalContext('client_token')",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 960,
  "y": 460,
  "wires": [
    [
      "4626730c59af348f"
    ]
  ],
  "_order": 27
}

module.exports = Node;