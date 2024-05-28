const Node = {
  "id": "b5e18d2d3c70f085",
  "type": "change",
  "z": "c29d7c6ad66794e5",
  "name": "currentRetryAttempt+1",
  "rules": [
    {
      "t": "set",
      "p": "config.currentRetryAttempt",
      "pt": "msg",
      "to": "config.currentRetryAttempt+1",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "config.schedule_name",
      "pt": "msg",
      "to": "config.schedule_name & \"_\" & config.currentRetryAttempt",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 400,
  "y": 80,
  "wires": [
    [
      "30f5f32f862e0d33"
    ]
  ]
}

module.exports = Node;