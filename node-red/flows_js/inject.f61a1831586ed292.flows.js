const Node = {
  "id": "f61a1831586ed292",
  "type": "inject",
  "z": "b0363dafd369e927",
  "name": "",
  "props": [
    {
      "p": "success",
      "v": "true",
      "vt": "bool"
    },
    {
      "p": "dato",
      "v": "$millis() ~> $fromMillis(\"[Y0001]-[M01]-[D01]\")",
      "vt": "jsonata"
    }
  ],
  "repeat": "",
  "crontab": "",
  "once": false,
  "onceDelay": "1",
  "topic": "",
  "x": 150,
  "y": 380,
  "wires": [
    [
      "7e6dc21bbc1190eb"
    ]
  ]
}

module.exports = Node;