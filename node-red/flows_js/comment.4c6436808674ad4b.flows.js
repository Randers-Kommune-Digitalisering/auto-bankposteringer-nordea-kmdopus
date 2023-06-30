const Node = {
  "id": "4c6436808674ad4b",
  "type": "comment",
  "z": "97cc6bce53027f96",
  "name": "old testdata",
  "info": "",
  "x": 190,
  "y": 260,
  "wires": [],
  "_order": 119
}

Node.info = `

    
    {
        "rule": 0,
        "data": [
            0,
            1,
            2,
            3
        ]
    },
    {
        "rule": "Check string",
        "data": "This is a string that contains the words Hello World"
    },
    {
        "rule": [
            "Check string",
            3
        ],
        "data": [
            "Hello World",
            "Another string",
            "",
            3
        ]
    }
`

module.exports = Node;