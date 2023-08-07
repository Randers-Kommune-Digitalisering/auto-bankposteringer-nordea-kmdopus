const Node = {
  "id": "ce6f40117064f2be",
  "type": "change",
  "z": "3ba6bac1c411ace6",
  "name": "",
  "rules": [
    {
      "t": "set",
      "p": "rules",
      "pt": "msg",
      "to": "$.payload ~> |$|\t{\t    \"value\": \t        type = \"number\" ?\t            value ~> $number() \t        :\t        type = \"bool\" ?\t            value = \"true\" ? true : false\t        :\t            value\t    \t}\t|",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 390,
  "y": 280,
  "wires": [
    [
      "044a69d3b6c76b8d"
    ]
  ],
  "_order": 105
}

module.exports = Node;