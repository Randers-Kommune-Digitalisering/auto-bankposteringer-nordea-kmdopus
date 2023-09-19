const Node = {
  "id": "e30c6c3b99cb3a24",
  "type": "inject",
  "z": "d64ae6beab0c9367",
  "name": "Testregler",
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
  "payload": "[\t   [\t       {\t           \"name\":\"Reference\",\t           \"value\":\"8152290\",\t           \"operator\":\".startsWith\"\t       },\t       {\t           \"name\":\"Advisliste\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Afsender\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Posteringstype\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Beløb\",\t           \"value1\":-333.00,\t           \"value2\":null,\t           \"operator\":\"==\"\t       },\t       {\t            \"name\":\"Kontering\",\t            \"text\":\"Tekst fra bank\",\t            \"Artskonto\":40000000,\t            \"PSP\":\"XG-0000000006-00007\",\t            \"SIO\":null,\t            \"Notat\":\"SKAL STÅ FØR DEN GENERELLE REGEL\"\t       }\t   ],\t   [\t       {\t           \"name\":\"Reference\",\t           \"value\":\"6687210\",\t           \"operator\":\"contains\"\t       },\t       {\t           \"name\":\"Advisliste\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Afsender\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Posteringstype\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Beløb\",\t           \"value1\":-333.00,\t           \"value2\":null,\t           \"operator\":\"==\"\t       },\t       {\t            \"name\":\"Kontering\",\t            \"text\":\"Tekst fra bank\",\t            \"Artskonto\":40000000,\t            \"PSP\":\"XG-0000000006-00007\",\t            \"SIO\":null,\t            \"Notat\":\"SKAL STÅ FØR DEN GENERELLE REGEL\"\t       }\t   ]\t]",
  "payloadType": "jsonata",
  "x": 120,
  "y": 500,
  "wires": [
    [
      "71a3ac3e7ba01eae"
    ]
  ],
  "_order": 176
}

module.exports = Node;