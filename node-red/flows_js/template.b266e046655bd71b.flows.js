const Node = {
  "id": "b266e046655bd71b",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "name": "JavaScript backup",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 610,
  "y": 160,
  "wires": [
    []
  ],
  "_order": 110
}

Node.template = `
// 040723 14:25 - Ændringer af værdier på siden opdaterer ikke værdien i kildekoden og kommer derfor heller ikke med over i rules objektet
const ruleWrapper = document.querySelector(".ruleWrapper");
const addRuleButton = document.querySelector(".addRuleButton");
const deleteButtons = document.querySelectorAll(".deleteRowButton");
const inputs = document.getElementsByTagName("input");
const selects = document.getElementsByTagName("select");
const rules = _rules != null ? _rules : []; // Rules are defined in change node previous to this
const inputFields = { 0: "Reference", 1: "Advisliste", 2: "Afsender", 3: "Posteringstype", 4: "Beløb1", 5: "Beløb2", 6: "Posteringstekst", 7: "Artskonto", 8: "PSP", 9: "SIO", 10: "Notat" }
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
    if (ws) { ws.send(m); }
}

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
                innerIndex = j;
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
    const obj_array = rules[index];
    const numberShown = index + 1;
    const fragment = document.createDocumentFragment(); // Create a document fragment

    let section = document.createElement("section");
    let h2 = document.createElement("h2");
    h2.textContent = numberShown;
    section.appendChild(h2);

    let div = document.createElement("div");

    for (let i = 0; i < obj_array.length; i++) {
        const obj = obj_array[i];
        let article = document.createElement("article");
        let h3 = document.createElement("h3");

        if (i === 5) {
            let inputPosteringstekst = document.createElement("input");
            inputPosteringstekst.id = "input_Posteringstekst_value";
            inputPosteringstekst.value = obj.Posteringstekst || "";
            inputPosteringstekst.style.width = "300px";

            let inputArtskonto = document.createElement("input");
            inputArtskonto.id = "input_Artskonto_value";
            inputArtskonto.value = obj.Artskonto || "";
            inputArtskonto.style.width = "85px";

            let inputPSP = document.createElement("input");
            inputPSP.id = "input_PSP_value";
            inputPSP.value = obj.PSP || "";
            inputPSP.style.width = "170px";

            let inputNotat = document.createElement("input");
            inputNotat.id = "input_Notat_value";
            inputNotat.value = obj.Notat || "";
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
        } else {
            h3.textContent = obj.name;
            let select = document.createElement("select");
            select.id = \`input_\${obj.name}_operator\`;

            if (i === 4) {
                for (let j = 0; j < valueOperators.length; j++) {
                    let option = document.createElement("option");
                    option.value = valueOperators[j].value;
                    option.text = valueOperators[j].name;
                    if (obj.operator == valueOperators[j].value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            } else {
                for (let j = 0; j < textOperators.length; j++) {
                    let option = document.createElement("option");
                    option.value = textOperators[j].value;
                    option.text = textOperators[j].name;
                    if (obj.operator == textOperators[j].value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            }
            article.appendChild(h3);
            article.appendChild(select);
        }
        let input = document.createElement("input");
        input.id = \`input_\${obj.name}_value\`;
        input.value = !obj.value ? "" : obj.value;
        article.appendChild(input);

        div.appendChild(article);
    }
    section.appendChild(div);

    let deleteButton = document.createElement("button");
    deleteButton.className = "deleteRowButton";
    deleteButton.textContent = "Slet regel";
    deleteButton.onclick = function () {
        deleteRow(index);
    };
    section.appendChild(deleteButton);

    fragment.appendChild(section); // Append the section to the fragment

    return fragment; // Return the document fragment
}




// Slet en linje
function deleteRow(rowIndex) {
    if (rowIndex >= 0 && rowIndex < rules.length) {
        rules.splice(rowIndex, 1);
        PublishWsMessage(JSON.stringify(rules));
        ruleWrapper.innerHTML = "";
        for (let i = 0; i < rules.length; i++) {
            ruleWrapper.appendChild(generateRule(i).cloneNode(true)); // Append the cloned content
        }
    }
}


// Lav ny tom linje
function generateNewRow() {
    const sampleRow = rules[0];
    const newRowNumber = rules.length;
    const newRowNumberShown = newRowNumber + 1;

    let newRow = [];
    for (let i = 0; i < sampleRow.length; i++) {
        const obj = sampleRow[i];
        let newObj;
        switch (i) {
            case 5:
                newObj = {
                    name: obj.name,
                    text: '',
                    Artskonto: null,
                    PSP: null,
                    SIO: null,
                    Notat: '',
                };
                break;
            case 4:
                newObj = {
                    name: obj.name,
                    value1: null,
                    value2: null,
                    operator: '',
                };
                break;
            default:
                newObj = {
                    name: obj.name,
                    value: null,
                    operator: '',
                };
                break;
        }
        newRow.push(newObj);
    }
    rules.push(newRow);

    const section = document.createElement('section');
    const h2 = document.createElement('h2');
    h2.textContent = newRowNumberShown;
    section.appendChild(h2);

    const div = document.createElement('div');

    for (let i = 0; i < newRow.length; i++) {
        const obj = newRow[i];
        const article = document.createElement('article');
        const h3 = document.createElement('h3');

        if (i === 5) {
            h3.textContent = 'Posteringstekst';
            const input = document.createElement('input');
            input.id = 'input_Posteringstekst_value';
            input.value = '';
            input.style.width = '300px';
            article.appendChild(h3);
            article.appendChild(input);
        } else {
            h3.textContent = obj.name;
            const select = document.createElement('select');
            select.id = \`input_\${obj.name}_operator\`;

            if (i === 4) {
                for (let j = 0; j < valueOperators.length; j++) {
                    const option = document.createElement('option');
                    option.value = valueOperators[j].value;
                    option.text = valueOperators[j].name;
                    select.appendChild(option);
                }
            } else {
                for (let j = 0; j < textOperators.length; j++) {
                    const option = document.createElement('option');
                    option.value = textOperators[j].value;
                    option.text = textOperators[j].name;
                    select.appendChild(option);
                }
            }

            const input = document.createElement('input');
            input.id = \`input_\${obj.name}_value\`;
            input.value = '';
            select.appendChild(input);

            article.appendChild(h3);
            article.appendChild(select);
        }

        div.appendChild(article);
    }

    section.appendChild(div);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'deleteRowButton';
    deleteButton.textContent = 'Slet regel';
    deleteButton.onclick = function () {
        deleteRow(newRowNumber);
    };
    section.appendChild(deleteButton);

    ruleWrapper.appendChild(section);

    PublishWsMessage(JSON.stringify(rules));
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
}

// Læg regler i ruleWrapper
ruleWrapper.innerHTML = "";
for (let i = 0; i < rules.length; i++) {
    ruleWrapper.appendChild(generateRule(i).cloneNode(true)); // Append the cloned content
}

listenToEvents();

















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