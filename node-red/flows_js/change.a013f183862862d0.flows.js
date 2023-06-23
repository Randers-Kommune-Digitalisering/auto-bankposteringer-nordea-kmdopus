const Node = {
  "id": "a013f183862862d0",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "Headers fra flow til msg",
  "rules": [
    {
      "t": "set",
      "p": "headers.Content-Type",
      "pt": "flow",
      "to": "application/json",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.Signature",
      "pt": "flow",
      "to": "Signature",
      "tot": "flow",
      "dc": true
    },
    {
      "t": "set",
      "p": "headers.Digest",
      "pt": "flow",
      "to": "Digest",
      "tot": "flow",
      "dc": true
    },
    {
      "t": "set",
      "p": "headers.X-Nordea-Originating-Date",
      "pt": "flow",
      "to": "X-Nordea-Originating-Date",
      "tot": "flow",
      "dc": true
    },
    {
      "t": "set",
      "p": "headers.X-Nordea-Originating-Date",
      "pt": "flow",
      "to": "X-Nordea-Originating-Host",
      "tot": "flow",
      "dc": true
    },
    {
      "t": "set",
      "p": "headers.X-IBM-Client-Id",
      "pt": "flow",
      "to": "X-IBM-Client-Id",
      "tot": "flow",
      "dc": true
    },
    {
      "t": "set",
      "p": "headers.X-IBM-Client-Secret",
      "pt": "flow",
      "to": "X-IBM-Client-Secret",
      "tot": "flow",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1070,
  "y": 100,
  "wires": [
    [
      "6b1d7553508977f1"
    ]
  ],
  "_order": 34
}

module.exports = Node;