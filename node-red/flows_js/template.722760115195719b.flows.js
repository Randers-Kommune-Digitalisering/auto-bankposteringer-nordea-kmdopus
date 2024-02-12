const Node = {
  "id": "722760115195719b",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "d": true,
  "name": "JavaScript backup",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 1490,
  "y": 60,
  "wires": [
    []
  ],
  "_order": 253
}

Node.template = `
const ruleWrapper = document.querySelector(".ruleWrapper");
const addRuleButton = document.querySelector(".addRuleButton");
const deleteButtons = document.querySelectorAll(".deleteRowButton");
const disableButtons = document.querySelectorAll(".disableButton");
const inputs = document.getElementsByTagName("input");
const selects = document.getElementsByTagName("select");
const rules = _rules != null ? _rules : []; // Rules are defined in change node previous to this
const activeRules = rules.filter(rule => rule[6].active);
const inputFields = { 0: "Reference", 1: "Advisliste", 2: "Afsender", 3: "Posteringstype", 4: "Beløb1", 5: "Beløb2", 6: "Posteringstekst", 7: "Artskonto", 8: "PSP", 9: "SIO", 10: "Notat" };
const textOperators = [
    { "name": "= Skal være lig med", "value": "==" },
    { "name": "{?} Indeholder", "value": "contains" },
    { "name": "{!} Indeholder ikke", "value": "!contains" },
    { "name": "[o] Skal være oplyst", "value": "!null" },
    { "name": "[...] Starter med", "value": ".startsWith" },
    { "name": "Slutter med [...]", "value": ".endsWith" }
]
const valueOperators = [
    { "name": "= Skal være lig med", "value": "==" },
    { "name": "≠ Må ikke være lig med", "value": "!=" },
    { "name": "< Skal være mindre end", "value": "<" },
    { "name": "> Skal være større end", "value": ">" },
    { "name": "< Mellem <", "value": ">< " },
]

function PublishWsMessage(m) {
    if (ws) {
        console.log("Sending WS message:", m); // Log the message being sent
        ws.send(m);
    }
}

/// Ved opdatering af input value
function updateValue(inputField) {
    let id = inputField.id;   // f.eks. input_afsender_value
    let sid = id.split("_");  // f.eks. input, afsender, value
    let ruleObject = null;
    let konteringPointer = false;
    let ruleIndex = -1;
    let innerIndex = -1;
    for (let i = 0; i < rules.length; i++) {
        for (let j = 0; j < rules[i].length; j++) {
            switch (j) {
                case 5:
                    if (sid[1] in rules[i][j]) { // når der peges på et felt der matcher en regel
                        ruleObject = rules[i][j]; // gem eksisterende regel i ruleObject
                        ruleIndex = i;
                        innerIndex = j;
                        konteringPointer = true;
                        break;
                    }
                    break;
                default:
                    if (rules[i][j].name === sid[1]) { // når der peges på et felt der matcher en regel
                        ruleObject = rules[i][j]; // gem eksisterende regel i ruleObject
                        ruleIndex = i;
                        innerIndex = j;
                        break;
                    }
                    break;
            }
        }
        if (ruleObject) { break; } // stop når der er match
    }
    if (ruleObject) { // når der er match
        let updatedRuleObject = null;
        if (konteringPointer) {
            updatedRuleObject = {
                ...ruleObject,
                [sid[1]]: inputField.value, // Update the specific property of the ruleObject
            };
        } else {
            updatedRuleObject = {
                ...ruleObject,
                [sid[2]]: inputField.value, // Update the specific property of the ruleObject
            };
        }

        rules[ruleIndex][innerIndex] = updatedRuleObject; // Assign the updated ruleObject back to the rules array
        PublishWsMessage(JSON.stringify(rules));
    }
    console.log("Saving user input to rules...");
}



// Sæt eksisterende regler ind på siden
function generateRule(index) {
    const forretningsregel = rules[index];

    const fragment = document.createDocumentFragment(); // Create a document fragment

    let section = document.createElement("section");
    let h2 = document.createElement("h2");
    h2.textContent = index + 1;
    section.appendChild(h2);

    let div = document.createElement("div");

    // forretningsregel.length - 1 fordi sidste property er "active" boolean, der ikke skal displayes
    for (let i = 0; i < forretningsregel.length - 1; i++) {
        const delregel = forretningsregel[i];
        let article = document.createElement("article");
        let h3 = document.createElement("h3");

        switch (i) {
            case 5:
                let inputPosteringstekst = document.createElement("input");
                inputPosteringstekst.id = "input_Posteringstekst_value";
                inputPosteringstekst.value = delregel.Posteringstekst || "";
                inputPosteringstekst.style.width = "300px";

                let inputArtskonto = document.createElement("input");
                inputArtskonto.id = "input_Artskonto_value";
                inputArtskonto.value = delregel.Artskonto || "";
                inputArtskonto.style.width = "85px";

                let inputPSP = document.createElement("input");
                inputPSP.id = "input_PSP_value";
                inputPSP.value = delregel.PSP || "";
                inputPSP.style.width = "170px";

                let inputNotat = document.createElement("input");
                inputNotat.id = "input_Notat_value";
                inputNotat.value = delregel.Notat || "";
                inputNotat.style.width = "700px";

                let articlePosteringstekst = document.createElement("article");
                let h3Posteringstekst = document.createElement("h3");
                h3Posteringstekst.textContent = "Posteringstekst";
                articlePosteringstekst.appendChild(h3Posteringstekst);
                articlePosteringstekst.appendChild(inputPosteringstekst);

                let articleArtskonto = document.createElement("article");
                let h3Artskonto = document.createElement("h3");
                h3Artskonto.textContent = "Artskonto";
                articleArtskonto.appendChild(h3Artskonto);
                articleArtskonto.appendChild(inputArtskonto);

                let articlePSP = document.createElement("article");
                let h3PSP = document.createElement("h3");
                h3PSP.textContent = "PSP";
                articlePSP.appendChild(h3PSP);
                articlePSP.appendChild(inputPSP);

                let articleNotat = document.createElement("article");
                let h3Notat = document.createElement("h3");
                h3Notat.textContent = "Notat";
                articleNotat.appendChild(h3Notat);
                articleNotat.appendChild(inputNotat);

                div.appendChild(articlePosteringstekst);
                div.appendChild(articleArtskonto);
                div.appendChild(articlePSP);
                div.appendChild(articleNotat);
                break;

            default:
                h3.textContent = delregel.name;
                let select = document.createElement("select");
                select.id = \`input_\${delregel.name}_operator\`;

                const operators = i === 4 ? valueOperators : textOperators;
                for (let j = 0; j < operators.length; j++) {
                    let option = document.createElement("option");
                    option.value = operators[j].value;
                    option.text = operators[j].name;
                    if (delregel.operator == operators[j].value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }

                article.appendChild(h3);
                article.appendChild(select);
        }
        switch (i) {
            case 4:
                let input1 = document.createElement("input");
                input1.id = \`input_\${delregel.name}_value1\`;
                input1.value = !delregel.value1 ? "" : delregel.value1;
                article.appendChild(input1);

                let input2 = document.createElement("input");
                input2.id = \`input_\${delregel.name}_value2\`;
                input2.value = !delregel.value2 ? "" : delregel.value2;
                article.appendChild(input2);
                break;

            case 5:
                break;

            default:
                let input = document.createElement("input");
                input.id = \`input_\${delregel.name}_value\`;
                input.value = !delregel.value ? "" : delregel.value;
                article.appendChild(input);
                break;
        }
        switch (i) {
            case 5:
                break;
            default:
                div.appendChild(article);
                break;
        }
    }
    section.appendChild(div);

    let deleteButton = document.createElement("button");
    deleteButton.className = "deleteRowButton";
    deleteButton.textContent = "Slet regel";
    deleteButton.setAttribute("onclick", \`deleteRow(\${index})\`);

    section.appendChild(deleteButton);

    let disableButton = document.createElement("button");
    disableButton.className = "disableRuleButton";
    disableButton.textContent = "Deaktivér regel";
    disableButton.setAttribute("onclick", \`deactivateRow(\${index})\`);

    section.appendChild(disableButton);

    fragment.appendChild(section);

    return fragment;
}



// Lav ny tom linje
function generateNewRow() {
    const sampleRow = rules[0];

    let newRow = [];
    for (let i = 0; i < sampleRow.length; i++) {
        const obj = sampleRow[i];
        let newObj;
        switch (i) {
            case 6:
                newObj = {
                    active: true
                }
            case 5:
                newObj = {
                    name: obj.name,
                    Posteringstekst: '',
                    Artskonto: null,
                    PSP: null,
                    SIO: null,
                    Notat: ''
                };
                break;
            case 4:
                newObj = {
                    name: obj.name,
                    value1: null,
                    value2: null,
                    operator: ''
                };
                break;
            default:
                newObj = {
                    name: obj.name,
                    value: null,
                    operator: ''
                };
                break;
        }
        newRow.push(newObj);
    }
    rules.push(newRow);

    ruleWrapper.innerHTML = "";
    for (let i = 0; i < rules.length; i++) {
        ruleWrapper.appendChild(generateRule(i).cloneNode(true)); // Append the cloned content
    }
    PublishWsMessage(JSON.stringify(rules));
}



// Slet en linje
function deleteRow(rowIndex) {
    if (rowIndex >= 0 && rowIndex < rules.length) {
        rules.splice(rowIndex, 1);
        PublishWsMessage(JSON.stringify(rules));
        const ruleSection = ruleWrapper.children[rowIndex];
        ruleWrapper.removeChild(ruleSection);
        for (let i = rowIndex; i < ruleWrapper.children.length; i++) {
            const ruleElement = ruleWrapper.children[i];
            const h2 = ruleElement.querySelector("h2");
            h2.textContent = i + 1;
        }
    }
}



// Deactivate a row
function deactivateRow(rowIndex) {
    if (rowIndex >= 0 && rowIndex < rules.length) {
        rules[rowIndex][6].active = !rules[rowIndex][6].active;
        PublishWsMessage(JSON.stringify(rules));
        const ruleSection = ruleWrapper.children[rowIndex];
        ruleWrapper.removeChild(ruleSection);
    }
}




function listenToEvents() {
    // Add event listener for each delete button
    for (let i = 0; i < deleteButtons.length; i++) {
        deleteButtons[i].addEventListener("click", () => {
            console.log("Delete rule event triggered");
            deleteRow(i);
        });
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
    // Add event listener to each select element
    for (let i = 0; i < disableButtons.length; i++) {
        disableButtons[i].addEventListener("click", () => {
            console.log("Disable/enable rule event triggered");
            deactivateRow(i);
        });
    }
}

// Læg regler i ruleWrapper
ruleWrapper.innerHTML = "";
for (let i = 0; i < rules.length; i++) {
    ruleWrapper.appendChild(generateRule(i).cloneNode(true)); // Append the cloned content
}

listenToEvents();

















// WEB SOCKET (node-red)
var ws;
var wsUri;
var loc = window.location; //console.log(loc);

if (loc.protocol === "https:") {
    wsUri = "wss:";
} else {
    wsUri = "ws:";
}
// This needs to point to the web socket in the Node-RED flow
wsUri += "//" + loc.host + loc.pathname + "ws/rules"; // Append "ws/rules" to the pathname
console.log("WebSocket URL:", wsUri);

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