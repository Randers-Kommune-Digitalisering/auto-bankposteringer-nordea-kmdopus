const Node = {
  "id": "554f33cc9a0f201b",
  "type": "template",
  "z": "3ba6bac1c411ace6",
  "g": "c076bc29b23b9bd7",
  "name": "JavaScript",
  "field": "payload.script",
  "fieldType": "msg",
  "format": "javascript",
  "syntax": "plain",
  "template": "",
  "x": 1100,
  "y": 140,
  "wires": [
    [
      "7b5552a2187320fb"
    ]
  ]
}

Node.template = `
const ruleWrapper = document.querySelector(".ruleWrapper");
const addRule = document.querySelector(".addRuleButton");
const currentURL = window.location.href;
const navLinks = document.querySelectorAll("ul a");
let deleteRuleButtons; // bliver defineret i runtime, så knapperne rent faktisk er genereret
let toggleButtons;
let inputs;
let selects;
const rules = _rules != null ? _rules : [];
const inactiveRules = rules.filter(rule => !rule[7].active);
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

// Send aktivitet til backend
function PublishWsMessage(m) {
    if (ws) {
        console.log("Sending WS message:", m);
        ws.send(m);
    }
}

function renderRule(pointerRule) {
    const fragment = document.createDocumentFragment();
    let section = document.createElement("section");
    section.id = \`rule_\${pointerRule[8].ruleId}\`;
    let h2 = document.createElement("h2");

    h2.textContent = parseInt(pointerRule[8].ruleId) + 1;
    section.appendChild(h2);
    let div = document.createElement("div");

    let articleContainerKontering = document.createElement("section");
    articleContainerKontering.className = "articleContainer";
    let h3ArticleContainerKontering = document.createElement("h3");
    h3ArticleContainerKontering.textContent = "Kontering";
    articleContainerKontering.appendChild(h3ArticleContainerKontering);

    let articleContainerSearch = document.createElement("section");
    articleContainerSearch.className = "articleContainer";
    let h3ArticleContainerSearch = document.createElement("h3");
    h3ArticleContainerSearch.textContent = "Søgeværktøjer";
    articleContainerSearch.appendChild(h3ArticleContainerSearch);

    for (let i = 0; i < Object.keys(pointerRule).length - 2; i++) {       // - 2 fordi de sidste to properties ikke skal displayes
        const delregel = pointerRule[i];
        let article = document.createElement("article");
        let h4 = document.createElement("h4");

        switch (i) {
            case 6:
                let inputPosteringstekst = document.createElement("input");
                inputPosteringstekst.id = pointerRule[8].ruleId;
                inputPosteringstekst.name = "Posteringstekst";
                inputPosteringstekst.value = delregel.Posteringstekst || "";
                inputPosteringstekst.style.width = "400px";
                let inputArtskonto = document.createElement("input");
                inputArtskonto.id = pointerRule[8].ruleId;
                inputArtskonto.name = "Artskonto";
                inputArtskonto.value = delregel.Artskonto || "";
                inputArtskonto.style.width = "100px";
                let inputPSP = document.createElement("input");
                inputPSP.id = pointerRule[8].ruleId;
                inputPSP.name = "PSP";
                inputPSP.value = delregel.PSP || "";
                inputPSP.style.width = "250px";
                let inputNotat = document.createElement("input");
                inputNotat.id = pointerRule[8].ruleId;
                inputNotat.name = "Notat";
                inputNotat.value = delregel.Notat || "";
                inputNotat.style.width = "700px";
                let articlePosteringstekst = document.createElement("article");
                let h4Posteringstekst = document.createElement("h4");
                h4Posteringstekst.textContent = "Posteringstekst";
                articlePosteringstekst.appendChild(h4Posteringstekst);
                articlePosteringstekst.appendChild(inputPosteringstekst);
                let articleArtskonto = document.createElement("article");
                let h4Artskonto = document.createElement("h4");
                h4Artskonto.textContent = "Artskonto";
                articleArtskonto.appendChild(h4Artskonto);
                articleArtskonto.appendChild(inputArtskonto);
                let articlePSP = document.createElement("article");
                let h4PSP = document.createElement("h4");
                h4PSP.textContent = "PSP";
                articlePSP.appendChild(h4PSP);
                articlePSP.appendChild(inputPSP);
                let articleNotat = document.createElement("article");
                let h4Notat = document.createElement("h4");
                h4Notat.textContent = "Notat";
                articleNotat.appendChild(h4Notat);
                articleNotat.appendChild(inputNotat);
                articleContainerKontering.appendChild(articlePosteringstekst);
                articleContainerKontering.appendChild(articleArtskonto);
                articleContainerKontering.appendChild(articlePSP);
                articleContainerKontering.appendChild(articleNotat);
                break;
            default:
                h4.textContent = delregel.name;
                let select = document.createElement("select");
                select.id = pointerRule[8].ruleId;
                select.name = delregel.name;
                const operators = i === 5 ? valueOperators : textOperators;

                for (let j = 0; j < operators.length; j++) {
                    let option = document.createElement("option");
                    option.value = operators[j].value;
                    option.text = operators[j].name;

                    if (delregel.operator == operators[j].value) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
                article.appendChild(h4);
                article.appendChild(select);
        }

        switch (i) {
            case 5:
                let input1 = document.createElement("input");
                input1.id = pointerRule[8].ruleId;
                input1.name = delregel.name;
                input1.value = !delregel.value1 ? "" : delregel.value1;
                article.appendChild(input1);
                let input2 = document.createElement("input");
                input2.id = pointerRule[8].ruleId;
                input2.name = delregel.name;
                input2.value = !delregel.value2 ? "" : delregel.value2;
                article.appendChild(input2);
                break;
            case 6:
                break;
            default:
                let input = document.createElement("input");
                input.id = pointerRule[8].ruleId;
                input.name = delregel.name
                input.value = !delregel.value ? "" : delregel.value;
                article.appendChild(input);
                break;
        }

        switch (i) {
            case 6:
                break;
            default:
                articleContainerSearch.appendChild(article);
                break;
        }
    }

    div.appendChild(articleContainerKontering);
    div.appendChild(articleContainerSearch);
    section.appendChild(div);

    let buttonContainer = document.createElement("div");
    buttonContainer.className = "buttonContainer";

    let deleteRuleButton = document.createElement("button");
    deleteRuleButton.className = "deleteRuleButton";
    deleteRuleButton.id = pointerRule[8].ruleId;
    deleteRuleButton.textContent = "Slet regel";
    buttonContainer.appendChild(deleteRuleButton);
    let toggleButton = document.createElement("button");
    toggleButton.className = "toggleButton";
    toggleButton.id = pointerRule[8].ruleId;
    toggleButton.textContent = "Deaktivér regel";
    buttonContainer.appendChild(toggleButton);

    section.appendChild(buttonContainer);

    fragment.appendChild(section);

    addEventListenersToRule(section)

    return fragment;
}

function generateNewRule() {
    let newRuleId = parseInt(rules[rules.length - 1][8].ruleId) + 1;
    const newRule = Object.keys(rules[0]).map((delregel) => {
        switch (delregel) {
            case "8":
                return { ruleId: newRuleId };
            case "7":
                return { active: false };
            case "6":
                return {
                    Posteringstekst: null,
                    Artskonto: null,
                    PSP: null,
                    Notat: null,
                };
            case "5":
                return {
                    name: delregel.name,
                    value1: null,
                    value2: null,
                    operator: null,
                };
            default:
                return {
                    name: delregel.name,
                    value: null,
                    operator: null,
                };
        }
    });
    rules.push(newRule);
    PublishWsMessage(JSON.stringify(rules));
    const newRuleFragment = renderRule(newRule);
    ruleWrapper.appendChild(newRuleFragment);
    addEventListenersToRule(newRuleFragment); // Add event listeners to the new rule
    console.log(\`New rule with id \${newRuleId} added\`);
}

function updateValue(pointerField) {
    const pointerId = Number(pointerField.id); // e.g., input_afsender_value
    const pointerDelregel = pointerField.name; // e.g., input, afsender, value
    const pointerIndex = rules.findIndex(rule => rule[8].ruleId === pointerId);
    console.log(rules[0][6].hasOwnProperty(pointerDelregel))

    if (pointerIndex !== -1) {
        const ruleToUpdate = rules[pointerIndex];
        let propertyIndex;

        if (rules[0][6].hasOwnProperty(pointerDelregel)) {
            propertyIndex = 6;
        } else {
            propertyIndex = ruleToUpdate.findIndex(property => property.name === pointerDelregel);
        }

        if (propertyIndex !== undefined) {
            if (propertyIndex === 6) {
                ruleToUpdate[propertyIndex][pointerDelregel] = pointerField.value;
            } else {
                if (pointerField.tagName === 'SELECT') {
                    ruleToUpdate[propertyIndex].operator = pointerField.options[pointerField.selectedIndex].value;
                } else {
                    ruleToUpdate[propertyIndex].value = pointerField.value;
                }
            }
            PublishWsMessage(JSON.stringify(rules));
            console.log(\`Rule \${pointerId}, \${pointerDelregel} updated\`);
        }
    }
}

function deleteRule(pointerButton) {
    let pointerId = Number(pointerButton.id);
    let pointerIndex = rules.findIndex(rule => rule[8].ruleId === pointerId);
    let pointerElement = document.getElementById(\`rule_\${pointerId}\`);
    if (pointerIndex >= 0 && pointerIndex < rules.length) {
        rules.splice(pointerIndex, 1);
        if (pointerElement) {
            pointerElement.remove();
        }
    }
    PublishWsMessage(JSON.stringify(rules));
    console.log(\`Rule \${pointerId} deleted\`);
}

function toggleRule(pointerButton) {
    let pointerId = Number(pointerButton.id);
    let pointerIndex = rules.findIndex(rule => rule[8].ruleId === pointerId);
    let pointerElement = document.getElementById(\`rule_\${pointerId}\`);
    if (pointerIndex >= 0 && pointerIndex < rules.length) {
        // inverse "active" property bool
        rules[pointerIndex][7].active = !rules[pointerIndex][7].active;
        if (pointerElement) {
            pointerElement.remove();
        }
    }
    PublishWsMessage(JSON.stringify(rules));
    console.log(\`Rule \${pointerId} active-status toggled\`)
}

function addEventListenersToRule(rule) {
    if (rule) {
        const deleteButton = rule.querySelector(".deleteRuleButton");
        const toggleButton = rule.querySelector(".toggleButton");
        const inputs = rule.querySelectorAll("input");
        const selects = rule.querySelectorAll("select");

        if (deleteButton) {
            deleteButton.addEventListener("click", () => {
                deleteRule(deleteButton);
            });
        }

        inputs.forEach(input => {
            if (input) {
                input.addEventListener("change", () => {
                    updateValue(input);
                });
            }
        });

        selects.forEach(select => {
            if (select) {
                select.addEventListener("change", () => {
                    updateValue(select);
                });
            }
        });

        if (toggleButton) {
            toggleButton.addEventListener("click", () => {
                toggleRule(toggleButton);
            });
        }
    }
}

function listenToEvents() {
    addRule.addEventListener("click", generateNewRule);
    window.addEventListener("reloadPage", function () {
        setTimeout(function () {
            window.location.reload();
        }, 1000); // 1000 = 1 sekund
    });
    window.addEventListener("DOMContentLoaded", function () {
        navLinks.forEach(function (link) {
            if (link.href === currentURL) {
                link.classList.add("active");
                if (link.parentElement.tagName === "LI") {
                    link.parentElement.classList.add("active");
                }
            }
        });
    });
}


// WEB SOCKET start
var ws;
var wsUri = "ws:";
var loc = window.location; //console.log(loc);

if (loc.protocol === "https:") { wsUri = "wss:"; }
// This needs to point to the web socket in the Node-RED flow
wsUri += "//" + loc.host + loc.pathname.replace("info", "ws/info");

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
// WEB SOCKET end

// RUNTIME start
ruleWrapper.innerHTML = "";
for (let i = 0; i < inactiveRules.length; i++) {
    ruleWrapper.appendChild(renderRule(inactiveRules[i]));
}

deleteRuleButtons = document.querySelectorAll(".deleteRuleButton");
toggleButtons = document.querySelectorAll(".toggleButton");
inputs = Array.from(document.getElementsByTagName("input"));
selects = Array.from(document.getElementsByTagName("select"));

listenToEvents();
// RUNTIME end
`

module.exports = Node;