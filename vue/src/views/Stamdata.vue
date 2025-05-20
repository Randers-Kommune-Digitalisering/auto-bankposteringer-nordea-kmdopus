<script setup>
    import { ref, onMounted, onUnmounted } from 'vue'
    import Content from '@/components/Content.vue'
    import IconTable from '@/components/icons/IconTable.vue'
    import IconAdd from '../components/icons/IconAdd.vue'
    import IconDelete from '../components/icons/IconDelete.vue'
    import IconSave from '../components/icons/IconSave.vue'
    import IconProfile from '@/components/icons/IconProfile.vue'
    import IconRefresh from '@/components/icons/IconRefresh.vue'
    import IconUpload from '@/components/icons/IconUpload.vue'

    const isUpdating = ref(false)
    const hasUpdated = ref(false)
    const isUpdating2 = ref(false)
    const hasUpdated2 = ref(false)
    const isUpdating3 = ref(false)

    const bankaccounts = ref(null)

    const adminNavn = ref("")
    const adminAuthID = ref("")
    const adminEmail = ref("")
    const erpSystem = ref("")
    const integrationBool = ref(false)

    const authStatus = ref("")

    const uploadStatus = ref('')
    const fileInput = ref(null)

    let pollInterval = null; // Polling interval reference

    function updateMasterdata() {
        hasUpdated.value = false
        isUpdating.value = true

        const url =  '/api/masterdata'
        
        fetch(url,
        {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "admName": adminNavn.value,
                "admID": adminAuthID.value,
                "admEmail": adminEmail.value,
                "erpSystem": erpSystem.value,
                "integrationBool": integrationBool.value 
            })
        })

        .then(response => {
            if(response.ok)
            {
                var value = response.json()
                return value
            }
            else
                throw new Error('Error connecting to back-end')
        })

        .finally(() => {
            isUpdating.value = false
            hasUpdated.value = true
        })
    }

    function addBankaccount() {
        bankaccounts.value.push({
            "bankAccountName": "",
            "bankAccount": "",
            "statusAccount": "",
            "intermediateAccount": ""
        })
    }

    function updateBankaccounts() {
        hasUpdated2.value = false
        isUpdating2.value = true
        
        fetch('/api/bankaccounts', {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bankaccounts.value)
        })
        .then(response => {
            if (response.ok) {
                var value = response.json()
                return value
            }
            else throw new Error('Error connecting to back-end')
        })
        .finally(() => {
            isUpdating2.value = false
            hasUpdated2.value = true
        })
    }

    function removeBankaccount(index) {
        bankaccounts.value.splice(index, 1)
    }

    function pollForAuthStatus() {
        const fetchAuthStatus = () => {
            fetch('/api/authstatus')
                .then(response => response.text())
                .then(data => {
                    authStatus.value = data;
                })
        };

        // Fetch immediately and then set the interval for continuous polling
        fetchAuthStatus();
        pollInterval = setInterval(fetchAuthStatus, 1000); // Poll every second
    }

    function pollForAuthRestartStatus(url, interval, maxRetries, onSuccess) {
        let retries = 0;
        let success = false;

        const poll = () => {
            fetch(url)
                .then(response => {
                    if (response.status === 200) {
                        onSuccess();
                        success = true;
                        return;
                    }
                    else if (response.status === 202 && retries < maxRetries) {
                        retries++;
                        setTimeout(poll, interval); // Retry after specified interval
                    }
                })
        };

        poll(); // Start polling
    }

    function restartAuth() {
        isUpdating3.value = true;

        pollForAuthRestartStatus(
            '/api/reauth',
            15000, // Poll every 15 seconds
            60,   // Max retries
            () => { // onSuccess
                isUpdating3.value = false;
            }
        );
    }

    function restartDatabase() {
        if (confirm('Er du sikker på, at du vil genstarte databasen? Kørselshistorik og åbne posteringer slettes.')) {
            fetch('/api/wipe-db')
                .then(response => {
                    if (response.ok) {
                        alert('Databasen er blevet genstartet.');
                    } else {
                        throw new Error('Kunne ikke genstarte. Prøv igen senere.');
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert('Der opstod en fejl under genstart.');
                });
        }
    }

    function restartRules() {
        if (confirm('Er du sikker på, at du vil genstarte databasen? Alle regler sættes til importerede csv-regler eller slettes.')) {
            fetch('/api/wipe-rules')
                .then(response => {
                    if (response.ok) {
                        alert('Databasen er blevet genstartet.');
                    } else {
                        throw new Error('Kunne ikke genstarte. Prøv igen senere.');
                    }
                })
                .catch(error => {
                    console.error(error);
                    alert('Der opstod en fejl under genstart.');
                });
        }
    }

    function triggerFileInput() {
        fileInput.value && fileInput.value.click();
    }

    function uploadRulesFile(event) {
        const file = event.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        uploadStatus.value = 'Uploader...'

        fetch('/api/upload/rules', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                uploadStatus.value = 'Uploadet!'
            } else {
                uploadStatus.value = 'Fejl ved upload'
            }
        })
        .catch(() => {
            uploadStatus.value = 'Fejl ved upload'
        })
        .finally(() => {
            // Reset file input so same file can be uploaded again if needed
            if (fileInput.value) fileInput.value.value = ''
            setTimeout(() => uploadStatus.value = '', 3000)
        })
    }

    // Retrieve updates to auth status
    onMounted(() => {
        pollForAuthStatus(); // Start continuous fetching when the component is mounted

        // Clean up polling when the component is destroyed
        onUnmounted(() => {
            clearInterval(pollInterval);
        });
    });

    fetch('/api/masterdata')
        .then(response => response = response.json())
        .then(value => {
            adminNavn.value = value.admName
            adminAuthID.value = value.admID
            adminEmail.value = value.admEmail
            erpSystem.value = value.erpSystem
            integrationBool.value = value.integrationBool
        })

    fetch('/api/bankaccounts')
        .then(response => response = response.json())
        .then(value => bankaccounts.value = value)

</script>

<template>

    <h2>Stamdata</h2>
    
    <Content>
        <template #icon>
            <IconProfile />
        </template>
        <template #heading>Administration</template>
        
        <table>
            <thead>
                <tr>
                    <th>Navn</th>
                    <th>E-mail</th>
                    <th>Authenticator ID</th>
                    <th>Økonomisystem</th>
                    <th>FTP</th>
                    <th>Autorisation</th>
                    <th>Genstart</th>
                </tr>
            </thead>
            <tr>
                <td><input v-model="adminNavn"></input></td>
                <td><input v-model="adminEmail"></input></td>
                <td><input v-model="adminAuthID"></input></td>
                <td><select v-model="erpSystem">
                    <option>KMD Opus</option>
                    <option>Fujitsu Prisme</option>
                    <option>ØS Indsigt</option>
                </select></td>
                <td><input type="checkbox" v-model="integrationBool"></td>
                <td><span>{{ authStatus ? authStatus : 'Inaktiv' }}</span></td>
                <td>
                    <button @click="restartAuth()" :disabled="isUpdating3"><IconRefresh /></button>
                </td>
            </tr>
        </table>
        <br />
        <div class="flexbox">
            <a :href="'/api/download/rules'" download="konteringsregler.json">
                <button type="button">Download regler</button>
            </a>
            <input
                type="file"
                accept="application/json"
                @change="uploadRulesFile"
                ref="fileInput"
                style="display: none;"
            />
            <button type="button" @click="triggerFileInput">Upload regler</button>
            <span v-if="uploadStatus" class="upload-status">{{ uploadStatus }}</span>
        </div>
        <br />
        <div class="flexbox">
            <button @click="restartRules()" class="red">Genstart regler</button>
            <button @click="restartDatabase()" class="red">Genstart database</button>
        </div>
        <br />
        <div class="flexbox">
            <button @click="updateMasterdata()" :disabled="isUpdating">
                <template v-if="isUpdating">Gemmer...</template>
                <template v-if="hasUpdated">Ændringer gemt</template>
                <template v-else><IconSave /></template>
            </button>
        </div>
    </Content>

    <Content>
        <template #icon>
            <IconTable />
        </template>
        <template #heading>Bankkonti</template>
        
        <table>
            <thead>
                <tr>
                    <th class="capitalize">Navn</th>
                    <th class="capitalize">IBAN</th>
                    <th class="capitalize">Statuskonto</th>     
                    <th class="capitalize">Mellemregning</th>     
                    <th class="capitalize">Slet</th>
                </tr>
            </thead>
            <tr v-for="(value, index) in bankaccounts">
                <td><input v-model="value.bankAccountName"></input></td>
                <td><input v-model="value.bankAccount"></input></td>
                <td><input v-model="value.statusAccount"></input></td>
                <td><input v-model="value.intermediateAccount"></input></td>
                <td><button @click="removeBankaccount(index)"><IconDelete /></button></td>
            </tr>
        </table>
        <br />
        <div class="flexbox">
            <button @click="addBankaccount()" class="blue"><IconAdd /></button>
            <button @click="updateBankaccounts()" :disabled="isUpdating2">
                <template v-if="isUpdating2">Gemmer...</template>
                <template v-if="hasUpdated2">Ændringer gemt</template>
                <template v-else><IconSave /></template>
            </button>
        </div>
    </Content>
</template>

<style scoped>
    button.red {
        background-color: #e74c3c;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
    }
    button.red:hover {
        background-color: #c0392b;
    }
    .upload-label {
        display: inline-block;
        cursor: pointer;
        margin-left: 1rem;
    }
    .upload-status {
        margin-left: 1rem;
        color: #2ecc40;
        font-weight: bold;
    }
</style>
