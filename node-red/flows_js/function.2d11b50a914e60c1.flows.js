const Node = {
  "id": "2d11b50a914e60c1",
  "type": "function",
  "z": "62eaf4407ee85a3a",
  "g": "9b2beb35be5bbb31",
  "name": "set global vars",
  "func": "",
  "outputs": 1,
  "noerr": 0,
  "initialize": "",
  "finalize": "",
  "libs": [
    {
      "var": "dayjs",
      "module": "dayjs"
    }
  ],
  "x": 135,
  "y": 600,
  "wires": [
    [
      "8553c6ad958744e2",
      "19a9e954c5d433ab"
    ]
  ],
  "icon": "font-awesome/fa-save",
  "l": false,
  "info": ""
}

Node.info = `
Format: ISO 8601
`

Node.func = async function (node, msg, RED, context, flow, global, env, util, dayjs) {
  function findDate() {
      let date = dayjs().startOf('day');
  
      if (date.day() === 1) { // If today is Monday
          date = date.subtract(3, 'day');
      } else {
          date = date.subtract(1, 'day');
      }
  
      return date.format('YYYY-MM-DD');
  }
  
  // Set global variables
  global.set("date", findDate());
  global.set("dateOfOrigin", dayjs().format('YYYYMMDD'));
  global.set("timeOfOrigin", dayjs().format('HHmmss'));
  
  return msg;
  
}

module.exports = Node;