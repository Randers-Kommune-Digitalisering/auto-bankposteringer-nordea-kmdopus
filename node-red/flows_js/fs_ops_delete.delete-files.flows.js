const Node = {
  "id": "delete-files",
  "type": "fs-ops-delete",
  "z": "30ea9c666c3d34a6",
  "g": "e213a029bb7d65e7",
  "name": "Delete Files",
  "path": "/data/output",
  "pathType": "str",
  "filename": "files",
  "filenameType": "msg",
  "x": 375,
  "y": 920,
  "wires": [
    [
      "log-deletion"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

module.exports = Node;