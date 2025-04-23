const Node = {
  "id": "0715142e73ad87d8",
  "type": "subflow",
  "name": "DB Try Connect",
  "info": "",
  "category": "",
  "in": [
    {
      "x": 40,
      "y": 80,
      "wires": [
        {
          "id": "51952dfcc38ee9b7"
        }
      ]
    }
  ],
  "out": [
    {
      "x": 470,
      "y": 60,
      "wires": [
        {
          "id": "be9543bf89f4293d",
          "port": 0
        }
      ]
    },
    {
      "x": 480,
      "y": 100,
      "wires": [
        {
          "id": "cb6650ce76904a8d",
          "port": 0
        }
      ]
    }
  ],
  "env": [],
  "meta": {},
  "color": "#3FADB5",
  "outputLabels": [
    "Success",
    "Error"
  ],
  "icon": "font-awesome/fa-database",
  "status": {
    "x": 620,
    "y": 60,
    "wires": [
      {
        "id": "71eca16ffb0317bd",
        "port": 0
      }
    ]
  }
}

module.exports = Node;