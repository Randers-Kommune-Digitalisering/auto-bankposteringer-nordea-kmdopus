const Node = {
  "id": "1b8cc635649a4519",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "e55824f191632e7c",
  "name": "generate global var",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 770,
  "y": 60,
  "wires": [
    [
      "8a3337373532e81f"
    ]
  ],
  "info": "",
  "_order": 118
}

Node.info = `
Format: ISO 8601
`

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  const today = new Date();
  
  function sidsteBankdag() {
      if (today.getDay() === 1) {
          today.setDate(today.getDate() - 3);
      } else {
          today.setDate(today.getDate() - 1)
      }
      
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      
      return `${year}-${month}-${day}`;
  }
  
  global.set("sidste_bankdag", sidsteBankdag());
  return msg;
}

module.exports = Node;