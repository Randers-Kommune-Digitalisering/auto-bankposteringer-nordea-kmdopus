const Node = {
  "id": "574926fd36ce7110",
  "type": "function",
  "z": "32cf2bec698ca424",
  "g": "a786d45e48e05c06",
  "name": "Construct SQL Query",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [],
  "x": 385,
  "y": 1180,
  "wires": [
    [
      "6be62e6f4b987f3a"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.func = async function (node, msg, RED, context, flow, global, env, util) {
  let data = msg.payload;
  
  // Get the keys from the first object to use as column names
  let columns = Object.keys(data);
  
  // Map over the array to generate values strings
  let values = columns.map(col => {
      let value = data[col];
      if (value === null) {
          return 'NULL';
      } else if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`;
      } else if (typeof value === 'boolean') {
          return value ? 'TRUE' : 'FALSE';
      } else {
          return value;
      }
  });
  
  let valueString = "";
  
  for (let index = 0; index < columns.length; index++) {
  
      valueString += columns[index] + " = " + values[index];
  
      if (index < columns.length - 1)
          valueString += ",";
  
      valueString += "\n";
  
  }
  
  valueString += "WHERE admID = " + data.admID;
  
  let sqlQuery = `UPDATE masterData SET ${valueString}`;
  msg.sql = sqlQuery;
  
  return msg;
}

module.exports = Node;