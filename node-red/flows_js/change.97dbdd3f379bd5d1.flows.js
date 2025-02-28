const Node = {
  "id": "97dbdd3f379bd5d1",
  "type": "change",
  "z": "ee0cf4ce372e2d36",
  "g": "6c0b1c62a8bd2bbc",
  "name": "Set headers",
  "rules": [
    {
      "t": "set",
      "p": "erp.csvHeaders",
      "pt": "global",
      "to": "[\"Artskonto\",\"Omkostningssted\",\"PSP-element\",\"Profitcenter\",\"Ordre\",\"Debet/kredit\",\"Beløb\",\"Næste agent\",\"Tekst\",\"Betalingsart\",\"Påligningsår\",\"Betalingsmodtagernr.\",\"Betalingsmodtagernr.kode\",\"Ydelsesmodtagernr.\",\"Ydelsesmodtagernr.kode\",\"Ydelsesperiode fra\",\"Ydelsesperiode til\",\"Oplysningspligtnr.\",\"Oplysningspligtmodtagernr.kode\",\"Oplysningspligtkode\",\"Netværk\",\"Operation\",\"Mængde\",\"Mængdeenhed\",\"Referencenøgle\"]",
      "tot": "json"
    }
  ],
  "action": "",
  "property": "",
  "from": "",
  "to": "",
  "reg": false,
  "x": 615,
  "y": 140,
  "wires": [
    [
      "f6228492c9e750d6"
    ]
  ],
  "icon": "font-awesome/fa-cog",
  "l": false
}

module.exports = Node;