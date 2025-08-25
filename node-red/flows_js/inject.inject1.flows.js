const Node = {
  "id": "inject1",
  "type": "inject",
  "z": "4049a8755a332ca0",
  "d": true,
  "name": "Inject String",
  "props": [
    {
      "p": "payload"
    }
  ],
  "repeat": "",
  "crontab": "",
  "once": true,
  "onceDelay": "2",
  "topic": "",
  "payload": "Hello from Node-RED!\\nThis is a new line.",
  "payloadType": "str",
  "x": 130,
  "y": 220,
  "wires": [
    [
      "function1"
    ]
  ]
}

module.exports = Node;