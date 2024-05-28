const Node = {
  "id": "c29d7c6ad66794e5",
  "type": "subflow",
  "name": "Retry",
  "info": "",
  "category": "",
  "in": [
    {
      "x": 60,
      "y": 100,
      "wires": [
        {
          "id": "c941b27bfad0cab3"
        }
      ]
    }
  ],
  "out": [
    {
      "x": 760,
      "y": 60,
      "wires": [
        {
          "id": "30f5f32f862e0d33",
          "port": 0
        }
      ]
    },
    {
      "x": 760,
      "y": 140,
      "wires": [
        {
          "id": "30f5f32f862e0d33",
          "port": 1
        }
      ]
    }
  ],
  "env": [],
  "meta": {},
  "color": "#DDAA99"
}

module.exports = Node;