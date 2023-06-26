const Node = {
  "id": "553cd726f3ffef1f",
  "type": "inject",
  "z": "8983772ca1c7d013",
  "name": "Start",
  "props": [
    {
      "p": "payload"
    }
  ],
  "repeat": "",
  "crontab": "30 07 * * 1,2,3,4,5",
  "once": false,
  "onceDelay": 0.1,
  "topic": "",
  "payload": "{}",
  "payloadType": "json",
  "x": 110,
  "y": 100,
  "wires": [
    [
      "024e78fda9e43eee"
    ]
  ],
  "_order": 15
}

module.exports = Node;