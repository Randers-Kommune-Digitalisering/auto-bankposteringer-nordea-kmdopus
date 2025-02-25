const Node = {
  "id": "73d7d240a587aa11",
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
          "id": "a9cf731359b19bac"
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
          "id": "b576def25a775a9f",
          "port": 0
        }
      ]
    },
    {
      "x": 480,
      "y": 100,
      "wires": [
        {
          "id": "6ebd13e4597c9b26",
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
        "id": "adb714bcd6c341b5",
        "port": 0
      }
    ]
  }
}

module.exports = Node;