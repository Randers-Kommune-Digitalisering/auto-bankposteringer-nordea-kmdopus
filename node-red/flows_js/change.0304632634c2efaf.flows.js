const Node = {
  "id": "0304632634c2efaf",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "Set headers",
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
      "p": "headers.Signature",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "headers.X-IBM-Client-Id",
      "pt": "msg",
      "to": "bff6e089c937b9d710e68c00d5114654",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.X-IBM-Client-Secret",
      "pt": "msg",
      "to": "d3cc01f5aa2be9d4946b9bc5834ea739",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.X-Nordea-Originating-Date",
      "pt": "msg",
      "to": "Tue, 25 Apr 2023 10:12:50 GMT",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.X-Nordea-Originating-Host",
      "pt": "msg",
      "to": "api.nordeaopenbanking.com",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 330,
  "y": 440,
  "wires": [
    [
      "0e0b554fa13cdf0a"
    ]
  ],
  "_order": 17
}

module.exports = Node;