const Node = {
  "id": "9e4e9f35ebe0d23c",
  "type": "change",
  "z": "6cc161e748b99815",
  "name": "💾",
  "rules": [
    {
      "t": "set",
      "p": "access_token",
      "pt": "global",
      "to": "payload.response.access_token",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "refresh_token",
      "pt": "global",
      "to": "payload.response.refresh_token",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 1250,
  "y": 280,
  "wires": [
    []
  ],
  "_order": 51
}

module.exports = Node;