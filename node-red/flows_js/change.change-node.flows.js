const Node = {
  "id": "change-node",
  "type": "change",
  "z": "9b998b2e60b3c784",
  "g": "db9c10bd096dcbc3",
  "name": "Clean data",
  "rules": [
    {
      "t": "set",
      "p": "payload",
      "pt": "msg",
      "to": "$map(\t   payload,\t   function($item) {\t       $map(\t           $item,\t           function($value, $key) {\t               $type($value) = \"string\" ? $value ~> $replace(\"\\\"\", \"`\") : $value \t           }\t       ) \t   }\t)",
      "tot": "jsonata"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 785,
  "y": 500,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;