const Node = {
  "id": "a63c9eebe49c49ea",
  "type": "template",
  "z": "97cc6bce53027f96",
  "name": "JavaScript",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 870,
  "y": 540,
  "wires": [
    [
      "487b9a4158444856"
    ]
  ],
  "_order": 81
}

Node.template = `
// 040723 14:25 - Ændringer af værdier på siden opdaterer ikke værdien i kildekoden og kommer derfor heller ikke med over i rules objektet


const ruleWrapper_user = document.querySelector(".ruleWrapper_user");
const addRuleButton = document.querySelector(".addRuleButton");

const rules = _rules != null ? _rules : []; // Rules are defined in change node previous to this

const inputFields = {0: "Reference", 1: "Advisliste", 2: "Afsender", 3: "Posteringstype", 4: "Beløb1", 5: "Beløb2", 6: "Posteringstekst", 7: "Artskonto", 8: "PSP", 9: "SIO", 10: "Notat"}

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

function PublishWsMessage(m) {
    if (ws) { ws.send(m); }
}

function generateRule(index) {
	const obj_array = rules[index]; // rules[index] returnerer et array
    let returnHTML = \`
        <div>
        <h1>\${index}</h1>
        <pad_big></pad_big>
    \`;

	for (let i = 0; i < obj_array.length; i++) {
		const obj = obj_array[i]
		
        if (i === 5) { // her er ingen operators
            returnHTML += \`
            <h2>Posteringstekst</h2>
            <input id="input_Posteringstekst_value" value="\${obj.text}" style="width:300px;"/>
            <h2>Artskonto</h2>
            <input id="input_Artskonto_value" value="\${obj.Artskonto}" style="width:85px;"/>
            <h2>PSP</h2>
            <input id="input_PSP_value" value="\${obj.PSP}" style="width:170px;"/>
            <h2>SIO</h2>            
            <input id="input_SIO_value" value="\${obj.SIO}" style="width:50px;"/>
            <h2>Notat</h2>
            <input id="input_Notat_value" value="\${obj.Notat}" style="width:700px;"/>
        \`;
        } else {

            returnHTML += \`   
                <h2>\${obj.name}</h2>
                <select id="input_\${obj.name}_operator">
            \`;

            for (let i = 0; i < operators.length; i++) {
                let isSelected = obj.operator == operators[i].value;
                //console.log("Checking '" + obj.operator + "' against '" + operators[i].value + "' = " + isSelected);
                returnHTML += \`<option value="\${operators[i].value}"\${isSelected ? " selected" : ""}>\${operators[i].name}</option>\`;
            }
            
            if (!obj.value) {
                if (i === 4) {
                    returnHTML += \`
                        </select>            
                        <input id="input_\${obj.name}1_value" value="\${obj.value1}" />
                        <input id="input_\${obj.name}2_value" value="\${obj.value2}" />
                        <pad_small></pad_small>
                    \`;
                } else {
                    returnHTML += \`
                        </select>            
                        <input id="input_\${obj.name}_value" value="" />
                        <pad_small></pad_small>
                    \`;                    
                }
            } else {
                returnHTML += \`
                    </select>            
                    <input id="input_\${obj.name}_value" value="\${obj.value}" />
                    <pad_small></pad_small>
                \`;
            }
        }         
    }
    returnHTML += \`
        </div>
    \`;
    return returnHTML;
}

// Læg regler i ruleWrapper
for (let i = 0; i < rules.length; i++) {
    ruleWrapper_user.innerHTML += generateRule(i);
}

// Add event listeners to track user changes
for (let i = 0; i < Object.keys(inputFields).length; i++) {
    const valueElement = document.querySelector(\`#input_\${inputFields[i]}_value\`);

    valueElement.addEventListener("focusout", () => {
        UpdateValue(valueElement);
    });

    valueElement.addEventListener("input", () => {
        OnInputChange(valueElement);
    });

    if (\`input_\${inputFields[i]}_operator\` in document) {
        const operatorElement = document.querySelector(\`#input_\${inputFields[i]}_operator\`);
        operatorElement.addEventListener("focusout", () => {
            UpdateValue(operatorElement);
        });
    }
}

/// Update input value
function UpdateValue(inputField) {
    let id = inputField.id;
    let sid = id.split("_");

    // Find the rule object with matching name property
    let ruleObject = null;
    for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].length; j++) {
            if (rules[i][j].name === sid[1]) {
                ruleObject = rules[i][j];
                break;
            }
        }
        if (ruleObject) {
            break;
        }
    }

    if (ruleObject) {
        ruleObject[sid[2]] = inputField.value;

        const message = rules;

        PublishWsMessage(JSON.stringify(message));
        console.log(message);
    }
}


///
//
function OnInputChange(inputField) {
    let id = inputField.id;
    let sid = id.split("_");

    // Find the rule object with matching name property
    let ruleObject = null;
    for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].length; j++) {
            if (rules[i][j].name === sid[1]) {
                ruleObject = rules[i][j];
                break;
            }
        }
        if (ruleObject) {
            break;
        }
    }

    if (ruleObject) {
        let type = ruleObject.type;

        switch (type) {
            case "int":
            case "float":
            case "double":
            case "number":
                inputField.value = inputField.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '\$1');
                break;

            case "text":
            case "letters":
                inputField.value = inputField.value.replace(/[^A-Za-z ]/g, '');
                break;
        }
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





// function generateNewRow
	


// document.querySelector("#addRuleButton").addEventListener("mouse", 
	

`

module.exports = Node;