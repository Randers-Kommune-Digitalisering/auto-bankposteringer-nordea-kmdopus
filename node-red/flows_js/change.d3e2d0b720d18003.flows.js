const Node = {
  "id": "d3e2d0b720d18003",
  "type": "change",
  "z": "a1938e80ddbe5950",
  "g": "517b687eb20ef6e5",
  "name": "Save response",
  "rules": [
    {
      "t": "set",
      "p": "exchange_code",
      "pt": "global",
      "to": "payload.response.code",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1560,
  "y": 200,
  "wires": [
    []
  ],
  "_order": 65
}

module.exports = Node;