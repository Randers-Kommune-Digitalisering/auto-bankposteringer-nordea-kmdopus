const Node = {
  "id": "ce6f40117064f2be",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "g": "8d5c48f3ea7b5469",
  "name": "Update til env",
  "rules": [
    {
      "t": "set",
      "p": "rules",
      "pt": "msg",
      "to": "$.payload ~> |$|\t{\t    \"value\": \t        type = \"number\" ?\t            value ~> $number() \t        :\t        type = \"bool\" ?\t            value = \"true\" ? true : false\t        :\t            value\t    \t}\t|",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "rules",
      "tot": "msg"
    },
    {
      "t": "set",
      "p": "konteringsregler",
      "pt": "global",
      "to": "rules",
      "tot": "msg"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 480,
  "y": 60,
  "wires": [
    [
      "60ce3b97bd606829"
    ]
  ],
  "_order": 239
}

module.exports = Node;