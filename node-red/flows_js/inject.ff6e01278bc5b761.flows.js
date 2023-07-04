const Node = {
  "id": "ff6e01278bc5b761",
  "type": "inject",
  "z": "97cc6bce53027f96",
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
  "payload": "[\t   [\t       {\t           \"name\":\"Reference\",\t           \"value\":\"8152290\",\t           \"operator\":\"contains\"\t       },\t       {\t           \"name\":\"Advisliste\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Afsender\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Posteringstype\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Beløb\",\t           \"value1\":-333.00,\t           \"value2\":null,\t           \"operator\":\"==\"\t       },\t       {\t            \"name\":\"Kontering\",\t            \"text\":\"Tekst fra bank\",\t            \"Artskonto\":40000000,\t            \"PSP\":\"XG-0000000006-00007\",\t            \"SIO\":null,\t            \"Notat\":\"SKAL STÅ FØR DEN GENERELLE REGEL\"\t       }\t   ],\t   [\t       {\t           \"name\":\"Reference\",\t           \"value\":\"6687210\",\t           \"operator\":\"contains\"\t       },\t       {\t           \"name\":\"Advisliste\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Afsender\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Posteringstype\",\t           \"value\":null,\t           \"operator\":null\t       },\t       {\t           \"name\":\"Beløb\",\t           \"value1\":-333.00,\t           \"value2\":null,\t           \"operator\":\"==\"\t       },\t       {\t            \"name\":\"Kontering\",\t            \"text\":\"Tekst fra bank\",\t            \"Artskonto\":40000000,\t            \"PSP\":\"XG-0000000006-00007\",\t            \"SIO\":null,\t            \"Notat\":\"SKAL STÅ FØR DEN GENERELLE REGEL\"\t       }\t   ]\t]",
  "payloadType": "jsonata",
  "x": 160,
  "y": 420,
  "wires": [
    [
      "123656358b9bc345"
    ]
  ],
  "_order": 97
}

module.exports = Node;