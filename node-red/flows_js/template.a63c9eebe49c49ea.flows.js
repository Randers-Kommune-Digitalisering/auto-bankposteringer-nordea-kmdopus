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
const ruleWrapper = document.querySelector(".ruleWrapper");
const addRuleButton = document.querySelector(".addRuleButton");
const inputs = document.getElementsByTagName("input");
const selects = document.getElementsByTagName("select");
const rules = _rules != null ? _rules : []; // Rules are defined in change node previous to this
const inputFields = { 0: "Reference", 1: "Advisliste", 2: "Afsender", 3: "Posteringstype", 4: "Beløb1", 5: "Beløb2", 6: "Posteringstekst", 7: "Artskonto", 8: "PSP", 9: "SIO", 10: "Notat" }
const operators = [
    { "name": "= Skal være lig med", "value": "==" },
    { "name": "≠ Må ikke være lig med", "value": "!=" },
    { "name": "< Skal være mindre end", "value": "<" },
    { "name": "> Skal være større end", "value": ">" },
    { "name": "{?} Indeholder", "value": "contains" },
    { "name": "{!} Indeholder ikke", "value": "!contains" },
    { "name": "[o] Skal være oplyst", "value": "!null" },
    { "name": "[...] Starter med", "value": ".startsWith" },
    { "name": "Slutter med [...]", "value": ".endsWith" }
]

function PublishWsMessage(m) {
    if (ws) { ws.send(m); }
}

// // Track ændringer i elementer med id input*
// function applyChanges() {
//     for (let i = 0; i < inputs.length; i++) {   
//         for (let j = 0; j < Object.keys(inputFields).length; j++) {
//             const valueElement = document.querySelector(\`#input_\${inputFields[j]}_value\`);
//             updateValue(valueElement);
//             onInputChange(valueElement);
//             if (\`input_\${inputFields[j]}_operator\` in document) {
//                 const operatorElement = document.querySelector(\`#input_\${inputFields[j]}_operator\`);
//                 updateValue(operatorElement);
//             }
//         }
//     }
//     for (let i = 0; i < selects.length; i++) {
//         for (let j = 0; j < Object.keys(inputFields).length; j++) {
//             const valueElement = document.querySelector(\`#input_\${inputFields[j]}_value\`);
//             updateValue(valueElement);
//             onInputChange(valueElement);
//             if (\`input_\${inputFields[j]}_operator\` in document) {
//                 const operatorElement = document.querySelector(\`#input_\${inputFields[j]}_operator\`);
//                 updateValue(operatorElement);
//             }
//         }
//     }
// }

/// Ved opdatering af input value
function updateValue(inputField) {
    let id = inputField.id;
    let sid = id.split("_");
    // Find the rule object with matching name property
    let ruleObject = null;
    let ruleIndex = -1;
    let innerIndex = -1;
    for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].length; j++) {
            if (rules[i][j].name === sid[1]) {
                ruleObject = rules[i][j];
                ruleIndex = i;
                innerIndex =j;
                break;
            }
        }
        if (ruleObject) { break; }
    }
    if (ruleObject) {
        ruleObject[sid[2]] = inputField.value;
        rules[ruleIndex][innerIndex] = ruleObject;
        let type = ruleObject.type;
        switch (type) {
            case "int":
            case "float":
            case "double":
            case "number":
                inputField.value = inputField.value.replace(/[^0-9.]/g, '').replace(/(\\..*?)\\..*/g, '\$1');
                break;
            default:
                inputField.setAttribute('value', inputField.value);
                break;
        }
        PublishWsMessage(JSON.stringify(rules));
    }
    console.log("Saving user input to rules...");
}


// Sæt eksisterende regler ind på siden
function generateRule(index) {
    const obj_array = rules[index]; // rules[index] returnerer et array
    let returnHTML = \`
        <div>
        <h1>\${index}</h1>
        <pad_big></pad_big>
    \`;
    for (let i = 0; i < obj_array.length; i++) {
        const obj = obj_array[i];
        if (i === 5) { // her er ingen operators
            returnHTML += \`
                <h2>Posteringstekst</h2>
                <input id="input_Posteringstekst_value" value="\`;
            if (obj.text) {
                returnHTML += \`\${obj.text}\`;
            } else {
                returnHTML += \`\`;
            }
            returnHTML += \`" style="width:300px;"/>
                <h2>Artskonto</h2>
                <input id="input_Artskonto_value" value="\`;
            if (obj.Artskonto) {
                returnHTML += \`\${obj.Artskonto}\`;
            } else {
                returnHTML += \`\`;
            }
            returnHTML += \`" style="width:85px;"/>
                <h2>PSP</h2>
                <input id="input_PSP_value" value="\`;
            if (obj.PSP) {
                returnHTML += \`\${obj.PSP}\`;
            } else {
                returnHTML += \`\`;
            }
            returnHTML += \`" style="width:170px;"/>
                <h2>SIO</h2>            
                <input id="input_SIO_value" value="\`;
            if (obj.SIO) {
                returnHTML += \`\${obj.SIO}\`;
            } else {
                returnHTML += \`\`;
            }
            returnHTML += \`" style="width:50px;"/>
                <h2>Notat</h2>
                <input id="input_Notat_value" value="\`;
            if (obj.Notat) {
                returnHTML += \`\${obj.Notat}\`;
            } else {
                returnHTML += \`\`;
            }
            returnHTML += \`" style="width:700px;"/>
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
                    \`;
                    if (obj.value2) {
                        returnHTML += \`
                            <input id="input_\${obj.name}2_value" value="\${obj.value2}" />
                        \`;
                    } else {
                        returnHTML += \`
                            <input id="input_\${obj.name}2_value" value="" />
                        \`;
                    }
                    returnHTML += \`
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

// Lav ny tom linje
function generateNewRow() {
    const sample_row = rules[0]; // rules[index] returnerer et array
    const newRowNumber = rules.length;
    let returnHTML = \`
        <div>
        <h1>\${newRowNumber}</h1>
        <pad_big></pad_big>
    \`;
    for (let i = 0; i < sample_row.length; i++) {
        const obj = sample_row[i];
        if (i === 5) { // her er ingen operators
            returnHTML += \`
            <h2>Posteringstekst</h2>
            <input id="input_Posteringstekst_value" value="" style="width:300px;"/>
            <h2>Artskonto</h2>
            <input id="input_Artskonto_value" value="" style="width:85px;"/>
            <h2>PSP</h2>
            <input id="input_PSP_value" value="" style="width:170px;"/>
            <h2>SIO</h2>            
            <input id="input_SIO_value" value="" style="width:50px;"/>
            <h2>Notat</h2>
            <input id="input_Notat_value" value="" style="width:700px;"/>
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
                        <input id="input_\${obj.name}1_value" value="" />
                        <input id="input_\${obj.name}2_value" value="" />
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
                    <input id="input_\${obj.name}_value" value="" />
                    <pad_small></pad_small>
                \`;
            }
        }
    }
    returnHTML += \`
        </div>
    \`;
    ruleWrapper.innerHTML += returnHTML;
}

// Læg regler i ruleWrapper
for (let i = 0; i < rules.length; i++) {
    ruleWrapper.innerHTML += generateRule(i);
}

// Add event listener to each input element
for (let i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener("change", () => {
        console.log("Input change event triggered");
        updateValue(inputs[i]);
    });
}

// Add event listener to each select element
for (let i = 0; i < selects.length; i++) {
    selects[i].addEventListener("change", () => {
        console.log("Select change event triggered");
        updateValue(selects[i]);
    });
}














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
`

module.exports = Node;