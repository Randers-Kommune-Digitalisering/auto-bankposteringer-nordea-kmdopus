const Node = {
  "id": "ffaf5565c469e046",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "1c9d2e5a1088096c",
  "name": "KMD Opus headers",
  "rules": [
    {
      "t": "set",
      "p": "erpFileHeaders",
      "pt": "flow",
      "to": "[\"Artskonto\",\"Omkostningssted\",\"PSP-element\",\"Profitcenter\",\"Ordre\",\"Debet/kredit\",\"Beløb\",\"Næste agent\",\"Tekst\",\"Betalingsart\",\"Påligningsår\",\"Betalingsmodtagernr.\",\"Betalingsmodtagernr.kode\",\"Ydelsesmodtagernr.\",\"Ydelsesmodtagernr.kode\",\"Ydelsesperiode fra\",\"Ydelsesperiode til\",\"Oplysningspligtnr.\",\"Oplysningspligtmodtagernr.kode\",\"Oplysningspligtkode\",\"Netværk\",\"Operation\",\"Mængde\",\"Mængdeenhed\",\"Referencenøgle\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 165,
  "y": 200,
  "wires": [
    [
      "f72448f1398c1221"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;