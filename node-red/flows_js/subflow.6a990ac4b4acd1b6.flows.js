const Node = {
  "id": "6a990ac4b4acd1b6",
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
          "id": "eb3264254e84da01"
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
          "id": "8891fbaffc9a8f8b",
          "port": 0
        },
        {
          "id": "3abcd3d83454406b",
          "port": 0
        },
        {
          "id": "1381e9448cc717c8",
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
    "x": 280,
    "y": 240,
    "wires": [
      {
        "id": "e5ecf125f5e51a6a",
        "port": 0
      },
      {
        "id": "b8e0c0b11374e782",
        "port": 0
      }
    ]
  }
}

module.exports = Node;