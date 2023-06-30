const Node = {
  "id": "ff6e01278bc5b761",
  "type": "inject",
  "z": "97cc6bce53027f96",
  "name": "Sæt og tjek testdata",
  "props": [
    {
      "p": "payload"
    }
  ],
  "repeat": "",
  "crontab": "",
  "once": false,
  "onceDelay": 0.1,
  "topic": "",
  "payload": "[\t   {\t       \"rule\": [ \"Check integer\", \"Regex\" ],\t       \"data\": [ 500, 2 ]\t    },\t   {\t       \"rule\": \"Check string\",\t       \"data\": [ \"Hello World\", \"hello world\" ]\t    }\t]",
  "payloadType": "jsonata",
  "x": 170,
  "y": 220,
  "wires": [
    [
      "0c99a9ce7708c33b"
    ]
  ],
  "_order": 120
}

module.exports = Node;