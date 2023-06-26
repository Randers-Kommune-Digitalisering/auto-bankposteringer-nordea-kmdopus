const Node = {
  "id": "d6d18db2510db5f3",
  "type": "change",
  "z": "8983772ca1c7d013",
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
      "tot": "flow"
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
      "tot": "flow"
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
  "x": 1020,
  "y": 180,
  "wires": [
    [
      "dc0a8174455bee28"
    ]
  ],
  "_order": 26
}

module.exports = Node;