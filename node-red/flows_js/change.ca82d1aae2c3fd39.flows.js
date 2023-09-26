const Node = {
  "id": "ca82d1aae2c3fd39",
  "type": "change",
  "z": "d64ae6beab0c9367",
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
      "1e78aff4a7fc27c0"
    ]
  ],
  "_order": 154
}

module.exports = Node;