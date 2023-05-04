const Node = {
  "id": "57847321551d9b9f",
  "type": "change",
  "z": "8983772ca1c7d013",
  "name": "Set elements in Signature",
  "rules": [
    {
      "t": "set",
      "p": "headers.Signature.keyId",
      "pt": "msg",
      "to": "headers.X-IBM-Client-Id",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "headers.Signature.algorithm",
      "pt": "msg",
      "to": "rsa-sha256",
      "tot": "str"
    },
    {
      "t": "set",
      "p": "headers.Signature.signature",
      "pt": "msg",
      "to": "d707r8QJ0GoYQXO5zSE2HzGpuHchrzUrie19J8tuqWV",
      "tot": "str"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 370,
  "y": 280,
  "wires": [
    [
      "7acc69c933084a6e"
    ]
  ],
  "_order": 23
}

module.exports = Node;