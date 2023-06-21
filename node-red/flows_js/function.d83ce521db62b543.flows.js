const Node = {
  "id": "d83ce521db62b543",
  "type": "function",
  "z": "8983772ca1c7d013",
  "name": "function 1",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 860,
  "y": 440,
  "wires": [
    [
      "8ab8ca3f5d815145"
    ]
  ],
  "_order": 30
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  console.log(msg);
  return msg;
}

module.exports = Node;