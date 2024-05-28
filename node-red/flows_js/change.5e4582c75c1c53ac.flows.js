const Node = {
  "id": "5e4582c75c1c53ac",
  "type": "change",
  "z": "73d7d240a587aa11",
  "g": "c12202788c8f2d66",
  "name": "Set stdout",
  "rules": [
    {
      "t": "set",
      "p": "stdout",
      "pt": "msg",
      "to": "{}",
      "tot": "json"
    },
    {
      "t": "set",
      "p": "stdout.timestamp",
      "pt": "msg",
      "to": "",
      "tot": "date"
    },
    {
      "t": "set",
      "p": "stdout.action",
      "pt": "msg",
      "to": "sql",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "stdout.affectedRows",
      "pt": "msg",
      "to": "payload.affectedRows ? payload.affectedRows : 0",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "stdout.succes",
      "pt": "msg",
      "to": "error ~> $exists() ? false : true",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "stdout.error",
      "pt": "msg",
      "to": "error ~> $exists() ? error.message",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 460,
  "y": 260,
  "wires": [
    [
      "ae2c8caee2e93c61"
    ]
  ]
}

module.exports = Node;