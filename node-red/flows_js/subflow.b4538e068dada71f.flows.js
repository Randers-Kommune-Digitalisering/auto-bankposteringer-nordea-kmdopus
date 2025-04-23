const Node = {
  "id": "b4538e068dada71f",
  "type": "subflow",
  "name": "DB Connect",
  "info": "",
  "category": "",
  "in": [
    {
      "x": 80,
      "y": 100,
      "wires": [
        {
          "id": "8ab1869e42b9c599"
        }
      ]
    }
  ],
  "out": [
    {
      "x": 500,
      "y": 100,
      "wires": [
        {
          "id": "d5016a7854844a9e",
          "port": 0
        },
        {
          "id": "4fa46c8f839d1f03",
          "port": 0
        },
        {
          "id": "8418c2d059744cad",
          "port": 0
        }
      ]
    }
  ],
  "env": [],
  "meta": {},
  "color": "#3FADB5",
  "icon": "font-awesome/fa-database",
  "status": {
    "x": 610,
    "y": 100,
    "wires": [
      {
        "id": "ca6647a021229ce1",
        "port": 0
      }
    ]
  }
}

module.exports = Node;