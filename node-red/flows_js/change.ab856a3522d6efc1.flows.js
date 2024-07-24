const Node = {
  "id": "ab856a3522d6efc1",
  "type": "change",
  "z": "VueExample",
  "name": "Sæt værdier",
  "rules": [
    {
      "t": "set",
      "p": "uidFromObj",
      "pt": "msg",
      "to": "payload.id",
      "tot": "msg"
    },
    {
      "t": "delete",
      "p": "payload.id",
      "pt": "msg"
    },
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "( payload ~> $keys() ) @ $key . /* Each key in items (0, 1, 2, 3, 4 ...) */\t{\t    $key:\t        ( payload ~> $lookup($key) ~> $keys() ) @ $dataKey . /* Each key in each item key (0.name, 1.name, 2.name, 2.value ...) */\t        (\t            $dataItem := payload ~> $lookup($key) ~> $lookup($dataKey); /* Find value */\t            {\t                $dataKey: ( $dataItem ~> $type() = \"string\" ? /* Replace quotations if value is string */\t                            $dataItem ~> $replace(\"\\\"\", \"`\") :\t                            $dataItem )\t            }\t        ) ~> $merge()\t} ~> $merge()\t",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 570,
  "y": 380,
  "wires": [
    [
      "61676c6c7947def6"
    ]
  ]
}

module.exports = Node;