const Node = {
  "id": "function-node",
  "type": "function",
  "z": "9b998b2e60b3c784",
  "g": "db9c10bd096dcbc3",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 815,
  "y": 500,
  "wires": [
    []
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let rows = msg.payload.map(item => {
      let values = Object.values(item).map(value => {
          if (typeof value === 'string') {
              return `'${value}'`;
          } else if (value === null) {
              return "NULL";
          } else {
              return value;
          }
      });
      return `(${values.join(", ")})`;
  });
  
  let columns = Object.keys(msg.payload[0]).join(", ");
  let sqlQuery = `INSERT INTO accountingRules (${columns}) VALUES ${rows.join(", ")};`;
  
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;