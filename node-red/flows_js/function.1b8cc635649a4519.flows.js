const Node = {
  "id": "1b8cc635649a4519",
  "type": "function",
  "z": "0b526691b09a2646",
  "g": "fe8a8f3f224328c7",
  "name": "Sidste bankdag",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 420,
  "y": 80,
  "wires": [
    [
      "7a7a78cc9c9515cd"
    ]
  ],
  "_order": 182
}

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