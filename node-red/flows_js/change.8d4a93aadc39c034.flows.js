const Node = {
  "id": "8d4a93aadc39c034",
  "type": "change",
  "z": "VueExample",
  "name": "Sæt værdier",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "( payload ~> $keys() ) @ $key . /* Each key in items (0, 1, 2, 3, 4 ...) */\t{\t    $key:\t        ( payload ~> $lookup($key) ~> $keys() ) @ $dataKey . /* Each key in each item key (0.name, 1.name, 2.name, 2.value ...) */\t        (\t            $dataItem := payload ~> $lookup($key) ~> $lookup($dataKey); /* Find value */\t            {\t                $dataKey: ( $dataItem ~> $type() = \"string\" ? /* Replace quotations if value is string */\t                            $dataItem ~> $replace(\"\\\"\", \"`\") :\t                            $dataItem )\t            }\t        ) ~> $merge()\t} ~> $merge()\t",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "payload[8].ruleId",
      "pt": "msg",
      "to": "( ( $globalContext(\"konteringsregler\") ~> $lookup(\"8\") ).ruleId ~> $max() ) + 1",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "newrule",
      "pt": "msg",
      "to": "payload",
      "tot": "msg",
      "dc": true
    },
    {
      "t": "set",
      "p": "ruleId",
      "pt": "msg",
      "to": "payload[8].ruleId",
      "tot": "msg",
      "dc": true
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 390,
  "y": 520,
  "wires": [
    [
      "5fff066a10b59124"
    ]
  ]
}

module.exports = Node;