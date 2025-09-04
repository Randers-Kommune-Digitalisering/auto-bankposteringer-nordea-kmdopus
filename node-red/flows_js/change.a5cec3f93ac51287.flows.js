const Node = {
  "id": "a5cec3f93ac51287",
  "type": "change",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Set vars",
  "rules": [
    {
      "t": "set",
      "p": "dates.bookingDate",
      "pt": "global",
      "to": "payload[0].bookingDate",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "runs.originUid",
      "pt": "global",
      "to": "uid",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 215,
  "y": 1240,
  "wires": [
    [
      "265fb2fc1879d7fb"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;