const Node = {
  "id": "1c2924583af9a255",
  "type": "ui-markdown",
  "z": "74de194f4f0868a4",
  "g": "de8e90487bfa723e",
  "group": "90df39afe8d995d2",
  "name": "Before you start",
  "order": 3,
  "width": 0,
  "height": 0,
  "content": "For at anvende løsningen, skal du som kommune først indgå aftaler med hhv. din bank og udbyderen af dit økonomisystem om udveksling af data.\n\nAftalen med din bank laves igennem en såkaldt Open Banking-leverandør. Nordea og Danske Bank leverer selv deres data, mens de resterende banker i Danmark leverer data igennem virksomhederne Bankdata, BEC eller SDC.\nNår aftalen er lavet, får du nogle koder som skal indlæses i denne løsning.\n\nEn lignende aftale indgås med ØS-leverandøren. I denne aftale er det i stedet dig der leverer data, som skal indlæses i ØS. Leveringen af data foregår igennem en FTP-forbindelse. Spørg din leverandør om mulighed for tilslutning.\nØnsker man ikke denne tilslutning, kan FOBI alligevel anvendes.\nFravælges FTP-forbindelsen, vil FOBI oprette finansbilag til manuel indlæsning i ØS.",
  "className": "",
  "x": 120,
  "y": 200,
  "wires": [
    []
  ]
}

module.exports = Node;