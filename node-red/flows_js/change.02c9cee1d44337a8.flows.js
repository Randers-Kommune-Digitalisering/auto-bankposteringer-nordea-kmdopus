const Node = {
  "id": "02c9cee1d44337a8",
  "type": "change",
  "z": "9b998b2e60b3c784",
  "g": "db9c10bd096dcbc3",
  "name": "Convert data",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "payload @ $item . /* Each item */\t(\t    ( $item ~> $keys() ) @ $key . /* Each key in items (0, 1, 2, 3, 4 ...) */\t    {\t        $key:\t            ( $item ~> $lookup($key) ~> $keys() ) @ $dataKey . /* Each key in each item key (0.name, 1.name, 2.name, 2.value ...) */\t            (\t                $dataItem := $item ~> $lookup($key) ~> $lookup($dataKey); /* Find value */\t                {\t                    $dataKey: ( $dataItem ~> $type() = \"string\" ? /* Replace quotations if value is string */\t                                $dataItem ~> $replace(\"\\\"\", \"`\") :\t                                $dataItem )\t                }\t            ) ~> $merge()\t    } ~> $merge() )\t",
      "tot": "jsonata"
    },
    {
      "t": "set",
      "p": "values",
      "pt": "msg",
      "to": "payload ~> $map( function($value, $key) {\t    \"('\" & ( $value ~> $string() ) & \"')\"\t}) ~> $join(\",\")",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 685,
  "y": 300,
  "wires": [
    [
      "c5aad48489925aca"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;