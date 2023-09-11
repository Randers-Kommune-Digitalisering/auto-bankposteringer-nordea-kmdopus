const Node = {
  "id": "5db23065cdabe714",
  "type": "change",
  "z": "0b526691b09a2646",
  "g": "9624c5429dc0adc3",
  "name": "env. to msg",
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
      "p": "headers.Authorization",
      "pt": "msg",
      "to": "'Bearer ' & $globalContext('access_token')",
      "tot": "jsonata"
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
      "p": "headers.X-IBM-Client-Secret",
      "pt": "msg",
      "to": "X-IBM-Client-Secret",
      "tot": "global"
    },
    {
      "t": "set",
      "p": "url",
      "pt": "msg",
      "to": "'https://' &$flowContext('url')",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 830,
  "y": 980,
  "wires": [
    [
      "bc5d2ac9098570ea"
    ]
  ],
  "_order": 122
}

module.exports = Node;