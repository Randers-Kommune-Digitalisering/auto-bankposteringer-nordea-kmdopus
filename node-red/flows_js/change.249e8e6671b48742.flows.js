const Node = {
  "id": "249e8e6671b48742",
  "type": "change",
  "z": "88c6307a5ee1dd81",
  "g": "54ef3083f50853f1",
  "name": "remove headers",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$join(\t  $filter(\t    $split($string(payload), \"\\n\"),\t    function($v, $i, $a) {\t      $i > 0\t    }\t  ),\t  \"\\n\"\t)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 405,
  "y": 100,
  "wires": [
    [
      "070b81cb735012a8"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;