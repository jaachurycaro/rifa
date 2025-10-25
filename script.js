document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIGURACIÓN DE FIREBASE ---
    // ¡ADVERTENCIA DE SEGURIDAD! Estas claves son visibles en el lado del cliente.
    // Asegúrate de configurar las Reglas de Seguridad en tu consola de Firebase
    // para proteger tu base de datos contra accesos no autorizados.
    const firebaseConfig = {
        apiKey: "AIzaSyD8ECDtHZfUzcO5ZvUayc9uGjajsFPEwBo",
        authDomain: "rifa-amor-propio.firebaseapp.com",
        databaseURL: "https://rifa-amor-propio-default-rtdb.firebaseio.com",
        projectId: "rifa-amor-propio",
        storageBucket: "rifa-amor-propio.firebasestorage.app",
        messagingSenderId: "994708612143",
        appId: "1:994708612143:web:3584f38ced5542dd3a12da"
    };

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();
    const raffleRef = database.ref('raffleState');

    // --- CONSTANTES Y VARIABLES GLOBALES --- 

    let raffleState = {}; // El estado ahora vendrá de Firebase
    let currentNumberToRegister = null;

    // --- ELEMENTOS DEL DOM ---
    const businessLogo = document.getElementById('business-logo');
    const mainTitle = document.getElementById('main-title');
    const raffleTitleDisplay = document.getElementById('raffle-title-display');
    const rafflePrizeInfo = document.getElementById('raffle-prize-info');
    const raffleDetailsDisplay = document.getElementById('raffle-details-display');
    const entryPanel = document.getElementById('entry-panel');
    const adminConfigPanel = document.getElementById('admin-config-panel');
    const participantView = document.getElementById('participant-view');
    const winnerDisplay = document.getElementById('winner-display');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminEntryBtn = document.getElementById('admin-entry-btn');
    const customerEntryBtn = document.getElementById('customer-entry-btn');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const configSection = document.getElementById('config-section');
    const manageSection = document.getElementById('manage-section');
    const raffleTitleInput = document.getElementById('raffle-title');
    const totalNumbersInput = document.getElementById('total-numbers');
    const rafflePriceInput = document.getElementById('raffle-price');
    const raffleDateInput = document.getElementById('raffle-date');
    const raffleLotteryInfoInput = document.getElementById('raffle-lottery-info');
    const createRaffleBtn = document.getElementById('create-raffle-btn');
    const qrUrlInput = document.getElementById('qr-url');
    const generateQrBtn = document.getElementById('generate-qr-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const resetRaffleBtn = document.getElementById('reset-raffle-btn');
    const raffleGrid = document.getElementById('raffle-grid');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const winnerNumberEl = document.getElementById('winner-number');
    const winnerNameEl = document.getElementById('winner-name');
    const winnerPhoneEl = document.getElementById('winner-phone');
    const toggleListBtn = document.getElementById('toggle-list-btn');
    const participantListContainer = document.getElementById('participant-list-container');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const participantListBody = document.getElementById('participant-list-body');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalNumberDisplay = document.getElementById('modal-number-display');
    const modalPriceDisplay = document.getElementById('modal-price-display');
    const participantNameInput = document.getElementById('participant-name-input');
    const participantPhoneInput = document.getElementById('participant-phone-input');
    const confirmNameBtn = document.getElementById('confirm-name-btn');
    const cancelNameBtn = document.getElementById('cancel-name-btn');
    const exitParticipantViewBtn = document.getElementById('exit-participant-view-btn');

    // --- FUNCIÓN AUXILIAR ---
    function formatNumber(num) {
        return String(num).padStart(2, '0');
    }

    // --- LÓGICA DE LA APLICACIÓN ---
    function updateUI(isAdmin = false) {
        [entryPanel, adminConfigPanel, participantView, winnerDisplay, rafflePrizeInfo].forEach(el => el.classList.add('hidden'));
        businessLogo.classList.add('hidden');

        mainTitle.textContent = raffleState.isConfigured ? 'Rifa Activa' : 'Sistema de Rifa';
        raffleTitleDisplay.textContent = raffleState.title || '';
        
        if (raffleState.isConfigured) {
            rafflePrizeInfo.classList.remove('hidden');
            const dateText = raffleState.date ? `Fecha: ${raffleState.date}` : '';
            const lotteryText = raffleState.lotteryInfo || '';
            raffleDetailsDisplay.textContent = `${lotteryText} - ${dateText}`;
        } else {
            raffleDetailsDisplay.textContent = '';
        }

        if (isAdmin) {
            // --- VISTA DE ADMINISTRADOR ---
            adminConfigPanel.classList.remove('hidden');
            if (raffleState.isConfigured) {
                manageSection.classList.remove('hidden');
                configSection.classList.add('hidden');
                generateParticipantList();
                generateRaffleGrid(); // También generar la grilla para que el admin la vea
            } else {
                manageSection.classList.add('hidden');
                configSection.classList.remove('hidden');
            }
        } else {
            // --- VISTA PÚBLICA (CLIENTE) ---
            entryPanel.classList.remove('hidden');
            // Resetear el formulario de login por si acaso
            document.getElementById('admin-login-form').classList.add('hidden');
            document.getElementById('entry-buttons').classList.remove('hidden');
        }
    }

    function generateRaffleGrid() {
        raffleGrid.innerHTML = '';
        if (!raffleState.totalNumbers) return;
        for (let i = 1; i <= raffleState.totalNumbers; i++) {
            const numberEl = document.createElement('div');
            numberEl.classList.add('raffle-number');
            numberEl.dataset.number = i;

            const numberSpan = document.createElement('span');
            numberSpan.classList.add('number');
            numberSpan.textContent = formatNumber(i);

            const participantSpan = document.createElement('span');
            participantSpan.classList.add('participant');

            if (raffleState.participants && raffleState.participants[i]) {
                const participant = raffleState.participants[i];
                numberEl.classList.add('taken');
                participantSpan.textContent = participant.name;
                numberEl.title = `Nombre: ${participant.name}\nTeléfono: ${participant.phone || 'N/A'}`;
            } else {
                numberEl.classList.add('available');
                participantSpan.textContent = 'Disponible';
            }

            numberEl.appendChild(numberSpan);
            numberEl.appendChild(participantSpan);
            raffleGrid.appendChild(numberEl);
        }
    }

    function generateParticipantList() {
        participantListBody.innerHTML = '';
        if (!raffleState.participants) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" style="text-align: center;">Aún no hay participantes.</td>`;
            participantListBody.appendChild(row);
            return;
        }
        const sortedParticipantKeys = Object.keys(raffleState.participants).sort((a, b) => parseInt(a) - parseInt(b));

        if (sortedParticipantKeys.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" style="text-align: center;">Aún no hay participantes.</td>`;
            participantListBody.appendChild(row);
            return;
        }

        for (const number of sortedParticipantKeys) {
            const participant = raffleState.participants[number];
            const row = document.createElement('tr');
            row.innerHTML = `<td>${formatNumber(number)}</td>
                                     <td>${participant.name}</td>
                                     <td>${participant.phone || 'No registrado'}</td>
                                     <td class="actions-cell">
                                        <button class="btn btn-primary action-btn edit-btn" data-number="${number}">Editar</button>
                                        <button class="btn btn-danger action-btn delete-btn" data-number="${number}">Eliminar</button>
                                     </td>`;
            participantListBody.appendChild(row);
        }
    }

    function handleParticipantListClick(e) {
        const target = e.target;
        const number = target.dataset.number;

        if (target.classList.contains('edit-btn')) {
            const participant = raffleState.participants[number];
            currentNumberToRegister = number;
            document.getElementById('modal-title').textContent = 'Editar Participante';
            modalNumberDisplay.textContent = formatNumber(number);
            modalPriceDisplay.textContent = (raffleState.price || 0).toLocaleString('es-CO');
            participantNameInput.value = participant.name;
            participantPhoneInput.value = participant.phone || '';
            modalOverlay.classList.add('visible');
            participantNameInput.focus();
        } else if (target.classList.contains('delete-btn')) {
            if (confirm(`¿Estás seguro de que quieres eliminar al participante del número ${formatNumber(number)}? El número quedará disponible.`)) {
                database.ref(`raffleState/participants/${number}`).remove();
            }
        }
    }

    function handleNumberClick(e) {
        const target = e.target.closest('.raffle-number');
        if (!target || !target.classList.contains('available')) return;

        const number = target.dataset.number;
        currentNumberToRegister = number;
        document.getElementById('modal-title').textContent = 'Registrar Número';
        modalNumberDisplay.textContent = formatNumber(number);
        modalPriceDisplay.textContent = (raffleState.price || 0).toLocaleString('es-CO');
        modalOverlay.classList.add('visible');
        participantNameInput.focus();
    }

    function closeModal() {
        modalOverlay.classList.remove('visible');
        participantNameInput.value = '';
        participantPhoneInput.value = '';
        currentNumberToRegister = null;
    }

    function exportToCsv() {
        if (!raffleState.participants || Object.keys(raffleState.participants).length === 0) {
            alert('No hay participantes para exportar.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Numero,Nombre,Telefono\r\n"; // Encabezados

        const sortedKeys = Object.keys(raffleState.participants).sort((a, b) => parseInt(a) - parseInt(b));

        sortedKeys.forEach(key => {
            const p = raffleState.participants[key];
            const row = [formatNumber(key), `"${p.name}"`, `"${p.phone || ''}"`].join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "participantes_rifa.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- MANEJADORES DE EVENTOS ---
    adminEntryBtn.addEventListener('click', () => {
        document.getElementById('admin-login-form').classList.remove('hidden');
        document.getElementById('entry-buttons').classList.add('hidden');
        adminPasswordInput.focus();
    });

    customerEntryBtn.addEventListener('click', () => {
        if (raffleState && raffleState.isConfigured) {
            entryPanel.classList.add('hidden');
            participantView.classList.remove('hidden');
            businessLogo.classList.remove('hidden');
            generateRaffleGrid();
        } else {
            alert('La rifa no está disponible en este momento. Vuelve a intentarlo más tarde.');
        }
    });

    loginBtn.addEventListener('click', () => {
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;
        
        if (!email || !password) {
            loginError.textContent = 'Por favor, ingresa correo y contraseña.';
            loginError.classList.remove('hidden');
            return;
        }

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // El éxito se maneja con onAuthStateChanged, no es necesario hacer nada aquí.
            })
            .catch((error) => {
                loginError.textContent = 'Error: Credenciales incorrectas.';
                loginError.classList.remove('hidden');
            });
    });

    createRaffleBtn.addEventListener('click', () => {
        const title = raffleTitleInput.value.trim();
        const totalNumbers = parseInt(totalNumbersInput.value, 10);
        const price = parseInt(rafflePriceInput.value, 10);
        const date = raffleDateInput.value;
        const lotteryInfo = raffleLotteryInfoInput.value.trim();

        if (!title || !totalNumbers || totalNumbers <= 0 || isNaN(price) || price < 0 || !date || !lotteryInfo) {
            alert('Por favor, completa todos los campos de configuración correctamente.');
            return;
        }
        const newState = { title, totalNumbers, price, date, lotteryInfo, participants: {}, isConfigured: true };
        raffleRef.set(newState);
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    resetRaffleBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres reiniciar la rifa? Se perderán todos los datos actuales.')) {
            // Al eliminar la referencia, el listener 'raffleRef.on' se activará automáticamente
            // y actualizará la UI para mostrar la pantalla de configuración.
            raffleRef.remove()
                .catch(error => console.error("Error al reiniciar la rifa:", error));
        }
    });

    confirmNameBtn.addEventListener('click', () => {
        const name = participantNameInput.value.trim();
        const phone = participantPhoneInput.value.trim();
        if (name && currentNumberToRegister) {
            const participantData = { name, phone };
            database.ref(`raffleState/participants/${currentNumberToRegister}`).set(participantData);
            closeModal();
        } else {
            alert('Por favor, ingresa al menos un nombre.');
        }
    });

    // --- EVENTOS SIMPLES ---
    participantListBody.addEventListener('click', handleParticipantListClick);
    raffleGrid.addEventListener('click', handleNumberClick);
    cancelNameBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    toggleListBtn.addEventListener('click', () => participantListContainer.classList.toggle('hidden'));
    exportCsvBtn.addEventListener('click', exportToCsv); 
    document.getElementById('exit-participant-view-btn').addEventListener('click', () => window.location.reload());

    // --- INICIALIZACIÓN ---
    let currentUser = null;

    // 1. Escuchar cambios en la autenticación (login/logout)
    auth.onAuthStateChanged(user => {
        currentUser = user;
        // Una vez que sabemos si el usuario está logueado o no, actualizamos la UI.
        // La data de la rifa ya la tenemos gracias al otro listener.
        updateUI(!!currentUser);
    });

    // 2. Escuchar cambios en los datos de la rifa
    raffleRef.on('value', (snapshot) => {
        const data = snapshot.val();
        raffleState = data ? data : { isConfigured: false };
        // Actualizamos la UI con los nuevos datos de la rifa.
        updateUI(!!currentUser);
    });
});
