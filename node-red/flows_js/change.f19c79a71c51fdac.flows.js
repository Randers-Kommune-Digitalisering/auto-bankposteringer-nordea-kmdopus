const Node = {
  "id": "f19c79a71c51fdac",
  "type": "change",
  "z": "c29d7c6ad66794e5",
  "name": "currentRetryAttempt=1",
  "rules": [
    {
      "t": "set",
      "p": "config.currentRetryAttempt",
      "pt": "msg",
      "to": "1",
      "tot": "num"
    },
    {
      "t": "set",
      "p": "config.schedule_name",
      "pt": "msg",
      "to": "config.schedule_name & \"_1\"",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 400,
  "y": 120,
  "wires": [
    [
      "30f5f32f862e0d33"
    ]
  ]
}

module.exports = Node;