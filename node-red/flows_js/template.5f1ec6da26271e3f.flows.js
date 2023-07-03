const Node = {
  "id": "5f1ec6da26271e3f",
  "type": "template",
  "z": "97cc6bce53027f96",
  "name": "JavaScript backup",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 890,
  "y": 580,
  "wires": [
    []
  ],
  "_order": 101
}

Node.template = `
const ruleWrapper_system = document.querySelector(".ruleWrapper_system");
const ruleWrapper_user = document.querySelector(".ruleWrapper_user");

const rules = _rules != null ? _rules : []; // Rules are defined in change node previous to this

const operators = [
    {
        "name": "= Skal være lig med",
        "value": "=="
    },
    {
        "name": "≠ Må ikke være lig med",
        "value": "!="
    },
    {
        "name": "< Skal være mindre end",
        "value": "<"
    },
    {
        "name": "> Skal være større end",
        "value": ">"
    },
    {
        "name": "{?} Indeholder",
        "value": "contains"
    },
    {
        "name": "{!} Indeholder ikke",
        "value": "!contains"
    },
    {
        "name": "[o] Skal være oplyst",
        "value": "!null"
    },
    {
        "name": "[...] Starter med",
        "value": ".startsWith"
    },
    {
        "name": "Slutter med [...]",
        "value": ".endsWith"
    }
]

function newSelector(selectedValue) {
    return \`
    \`;
}

function newInputField(index) {
    const obj = rules[index];
    let returnHTML = \`
        <div>    
            <select id="input_\${index}_operator"\${obj.systemrule == true ? " disabled=\\"disabled\\"" : ""}>
        \`;

    for (let i = 0; i < operators.length; i++) {
        let isSelected = obj.operator == operators[i].value;
        //console.log("Checking '" + obj.operator + "' against '" + operators[i].value + "' = " + isSelected);
        returnHTML += \`<option value="\${operators[i].value}"\${isSelected ? " selected" : ""}>\${operators[i].name}</option>\`;
    }
        // !!! description skal være et felt man kan skrive i

    returnHTML += \`
            </select>
            <input id="input_\${index}_value" value="\${obj.value}"\${obj.systemrule == true ? " disabled=\\"disabled\\"" : ""} />
        <span class="description" title="\${obj.notat}">?</span>
        </div>
    \`;
    return returnHTML;
}

///
// Instantiate input fields

for (let i = 0; i < rules.length; i++)
    if (rules[i]["systemrule"] != null && rules[i]["systemrule"] == true)
        ruleWrapper_system.innerHTML += newInputField(i);
    else
        ruleWrapper_user.innerHTML += newInputField(i);

///
// Dynamically add event listeners 

for (let i = 0; i < rules.length; i++) {
    document.querySelector("#input_" + i + "_operator").addEventListener("focusout", () => {
        UpdateValue(document.querySelector("#input_" + i + "_operator"));
    });

    document.querySelector("#input_" + i + "_value").addEventListener("focusout", () => {
        UpdateValue(document.querySelector("#input_" + i + "_value"));
    });

    document.querySelector("#input_" + i + "_value").addEventListener("input", () => {
        OnInputChange(document.querySelector("#input_" + i + "_value"));
    });
}

///
// Update input value
function UpdateValue(inputField) {
    let id = inputField.id;
    let sid = id.split("_");

    (rules[parseInt(sid[1])])[sid[2]] = inputField.value;

    const message = rules;

    PublishWsMessage(JSON.stringify(message));
    console.log(message);
}

///
//
function OnInputChange(inputField) {
    let id = inputField.id;
    let sid = id.split("_");
    let type = (rules[parseInt(sid[1])])["type"];

    switch (type) {
        case "int": case "float": case "double": case "number":
            inputField.value = inputField.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '\$1');
            break;

        case "text": case "letters":
            inputField.value = inputField.value.replace(/[^A-Za-z ]/g, '');
            break;

    }
}




///
// WEB SOCKET (node-red)
var ws;
var wsUri = "ws:";
var loc = window.location; //console.log(loc);

if (loc.protocol === "https:") { wsUri = "wss:"; }
// This needs to point to the web socket in the Node-RED flow
wsUri += "//" + loc.host + loc.pathname.replace("rules", "ws/rules");

function wsConnect() {

    console.log("Connecting to ", wsUri);
    ws = new WebSocket(wsUri);

    ws.onmessage = function (msg) {

        // parse the incoming message as a JSON object
        var data = msg.data;
        const obj = JSON.parse(data);

        console.log("Received WS message: " + JSON.stringify(obj));

        //ws.send(JSON.stringify({data:data}));
    }

    ws.onopen = function () {
        // update the status div with the connection status
        console.log("Connected to WS");
    }

    ws.onclose = function () {
        // update the status div with the connection status
        console.log("WS connection lost");
        // in case of lost connection tries to reconnect every 3 secs
        setTimeout(wsConnect, 3000);
    }
}
function PublishWsMessage(m) {
    if (ws) { ws.send(m); }
}
`

module.exports = Node;