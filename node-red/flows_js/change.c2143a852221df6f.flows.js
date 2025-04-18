const Node = {
  "id": "c2143a852221df6f",
  "type": "change",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Set vars",
  "rules": [
    {
      "t": "set",
      "p": "dates.bookingDate",
      "pt": "global",
      "to": "$fromMillis($toMillis(payload[0].originDate), \"[D01]-[M01]-[Y]\")",
      "tot": "jsonata"
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
  "x": 645,
  "y": 580,
  "wires": [
    [
      "92d167152b47a4bc"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false
}

module.exports = Node;