(() => {
    // === VARIABLES ===
    const predefinedSessions = {
        fullbody: ["Squat", "Développé couché", "Rowing", "Deadlift"],
        upperbody: ["Développé couché", "Rowing", "Tractions", "Curl biceps"],
        lowerbody: ["Squat", "Deadlift", "Fente", "Extension jambes"]
    };

    // MENU
    const menuWorkoutBtn = document.getElementById('menu-workout');
    const menuHistoryBtn = document.getElementById('menu-history');
    const pageWorkout = document.getElementById('page-workout');
    const pageHistory = document.getElementById('page-history');

    // WORKOUT PAGE ELEMENTS
    const sessionSelect = document.getElementById('session-select');
    const startStopBtn = document.getElementById('start-stop-btn');
    const sessionForm = document.getElementById('session-form');
    const exercisesContainer = document.getElementById('exercises-container');
    const timerDisplay = document.getElementById('timer');

    const manualAddDiv = document.getElementById('manual-add-exercise');
    const manualExerciseInput = document.getElementById('manual-exercise-name');
    const addManualBtn = document.getElementById('add-manual-exercise-btn');

    let timerInterval = null;
    let startTime = null;
    let manualExercises = [];
    let currentSavedData = null;

    // === MENU HANDLING ===
    function showPage(page) {
        if (page === 'workout') {
            pageWorkout.style.display = '';
            pageHistory.style.display = 'none';
            menuWorkoutBtn.classList.add('active');
            menuHistoryBtn.classList.remove('active');
        } else if (page === 'history') {
            pageWorkout.style.display = 'none';
            pageHistory.style.display = '';
            menuWorkoutBtn.classList.remove('active');
            menuHistoryBtn.classList.add('active');
            loadHistory();
        }
    }

    menuWorkoutBtn.addEventListener('click', () => showPage('workout'));
    menuHistoryBtn.addEventListener('click', () => showPage('history'));

    // === TIMER & SESSION MANAGEMENT ===

    // Format hh:mm:ss
    function formatDuration(ms) {
        let totalSeconds = Math.floor(ms / 1000);
        let h = Math.floor(totalSeconds / 3600);
        let m = Math.floor((totalSeconds % 3600) / 60);
        let s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function updateTimer() {
        const elapsed = Date.now() - startTime;
        timerDisplay.textContent = formatDuration(elapsed);
    }

    // Sauvegarde dans localStorage
    function saveCurrentSession() {
        const sessionData = {
            sessionKey: sessionSelect.value,
            startTime,
            manualExercises,
            exercisesData: getAllExerciseData()
        };
        localStorage.setItem('currentWorkout', JSON.stringify(sessionData));
    }

    function loadCurrentSession() {
        const saved = localStorage.getItem('currentWorkout');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    }

    function clearCurrentSession() {
        localStorage.removeItem('currentWorkout');
    }

    // Récupère données exercices du formulaire
    function getAllExerciseData() {
        const allSeriesData = [];
        const blocks = exercisesContainer.querySelectorAll('.exercise-block');
        blocks.forEach(block => {
            const series = [];
            const seriesDivs = block.querySelectorAll('.serie');
            seriesDivs.forEach(serieDiv => {
                const reps = serieDiv.querySelector('.reps').value.trim();
                const weight = serieDiv.querySelector('.weight').value.trim();
                series.push({ reps, weight });
            });
            allSeriesData.push(series);
        });
        return allSeriesData;
    }

    // Crée formulaire exercices (prédef + manuels)
    function createForm(predefExercises, savedData = null) {
        exercisesContainer.innerHTML = '';
        const allExercises = [...predefExercises, ...manualExercises];

        allExercises.forEach((ex, i) => {
            const isManual = i >= predefExercises.length;
            const divEx = document.createElement('div');
            divEx.classList.add('exercise-block');
            divEx.innerHTML = `<label><strong>${ex}${isManual ? ' (ajouté)' : ''} :</strong></label>`;

            const seriesContainer = document.createElement('div');
            seriesContainer.classList.add('series-container');

            // Par défaut, une série vide si aucune donnée
            const seriesSaved = savedData && savedData[i] ? savedData[i] : [{ reps: '', weight: '' }];

            function addSerie(reps = '', weight = '') {
                const serieDiv = document.createElement('div');
                serieDiv.classList.add('serie');
                serieDiv.innerHTML = `
            <input type="number" min="0" placeholder="Répétitions" class="reps" value="${reps}" />
            <input type="number" min="0" step="0.1" placeholder="Poids (kg)" class="weight" value="${weight}" />
          `;
                const btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.textContent = '−';
                btnRemove.title = "Supprimer cette série";
                btnRemove.addEventListener('click', () => {
                    serieDiv.remove();
                    if (seriesContainer.children.length === 0) addSerie();
                    saveCurrentSession();
                });
                serieDiv.appendChild(btnRemove);
                seriesContainer.appendChild(serieDiv);
            }

            seriesSaved.forEach(serie => addSerie(serie.reps, serie.weight));

            const btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.textContent = 'Ajouter une série';
            btnAdd.addEventListener('click', () => {
                addSerie();
                saveCurrentSession();
            });

            const btnCopy = document.createElement('button');
            btnCopy.type = 'button';
            btnCopy.textContent = 'Copier dernière série';
            btnCopy.style.marginLeft = '10px';
            btnCopy.addEventListener('click', () => {
                const allSeries = seriesContainer.querySelectorAll('.serie');
                if (allSeries.length === 0) {
                    addSerie();
                    saveCurrentSession();
                    return;
                }
                const lastSerie = allSeries[allSeries.length - 1];
                const lastWeight = lastSerie.querySelector('.weight').value;
                const lastReps = lastSerie.querySelector('.reps').value;
                addSerie(lastReps, lastWeight);
                saveCurrentSession();
            });

            divEx.appendChild(seriesContainer);
            divEx.appendChild(btnAdd);
            divEx.appendChild(btnCopy);

            exercisesContainer.appendChild(divEx);
        });
    }

    function addManualExercise(name) {
        if (!name.trim()) return;
        manualExercises.push(name.trim());
        createForm(predefinedSessions[sessionSelect.value], getCurrentExerciseData());
        manualExerciseInput.value = '';
        saveCurrentSession();
    }

    function getCurrentExerciseData() {
        const allSeriesData = [];
        const blocks = exercisesContainer.querySelectorAll('.exercise-block');
        blocks.forEach(block => {
            const series = [];
            const seriesDivs = block.querySelectorAll('.serie');
            seriesDivs.forEach(serieDiv => {
                const reps = serieDiv.querySelector('.reps').value.trim();
                const weight = serieDiv.querySelector('.weight').value.trim();
                series.push({ reps, weight });
            });
            allSeriesData.push(series);
        });
        return allSeriesData;
    }

    // Démarrer/arrêter séance
    function toggleSession() {
        if (timerInterval === null) {
            startTime = Date.now();
            manualExercises = [];
            timerDisplay.style.display = 'block';
            sessionForm.style.display = 'block';
            manualAddDiv.style.display = 'block';
            startStopBtn.textContent = 'Arrêter la séance';
            sessionSelect.disabled = true;
            createForm(predefinedSessions[sessionSelect.value]);
            saveCurrentSession();

            timerInterval = setInterval(() => {
                updateTimer();
            }, 1000);
        } else {
            if (!confirm("Voulez-vous vraiment arrêter la séance ?")) return;

            clearInterval(timerInterval);
            timerInterval = null;

            // Sauvegarder séance dans historique
            saveSessionToHistory();

            startTime = null;
            manualExercises = [];
            timerDisplay.style.display = 'none';
            sessionForm.style.display = 'none';
            manualAddDiv.style.display = 'none';
            startStopBtn.textContent = 'Démarrer la séance';
            sessionSelect.disabled = false;
            sessionSelect.value = '';
            startStopBtn.disabled = true;
            clearCurrentSession();
            exercisesContainer.innerHTML = '';
            timerDisplay.textContent = "00:00:00";
        }
    }

    // HISTORIQUE

    function loadHistory() {
        const historyListDiv = document.getElementById('history-list');
        historyListDiv.innerHTML = '';
        const historyRaw = localStorage.getItem('workoutHistory');
        let history = [];
        if (historyRaw) {
            try { history = JSON.parse(historyRaw) } catch { }
        }
        if (history.length === 0) {
            historyListDiv.textContent = "Aucune séance enregistrée.";
            return;
        }
        history.forEach(entry => {
            const div = document.createElement('div');
            div.classList.add('history-entry');
            const durationStr = formatDuration(entry.endTime - entry.startTime);

            // Affichage simple + bouton éditer
            div.innerHTML = `
          <header>
            <strong>Workout:</strong> ${entry.sessionKey} |
            <strong>Durée:</strong> ${durationStr}
            <button class="edit-btn" style="margin-left: 20px;">Modifier</button>
          </header>
          <div class="history-actions">
            <button class="download-btn">Télécharger</button>
            <button class="delete-btn">Supprimer</button>
          </div>
        `;

            // Conteneur édition caché
            const editDiv = document.createElement('div');
            editDiv.classList.add('edit-session-container');
            editDiv.style.borderTop = '1px solid #444';
            editDiv.style.marginTop = '10px';
            editDiv.style.paddingTop = '10px';
            editDiv.style.display = 'none';

            div.appendChild(editDiv);

            div.querySelector('.edit-btn').addEventListener('click', () => {
                if (editDiv.style.display === 'none') {
                    // Ouvrir édition
                    renderEditSession(entry, editDiv, div, history);
                    editDiv.style.display = 'block';
                } else {
                    // Fermer édition
                    editDiv.style.display = 'none';
                }
            });

            // Télécharger JSON
            div.querySelector('.download-btn').addEventListener('click', () => {
                const blob = new Blob([JSON.stringify(entry, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `workout_${entry.id}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });

            // Supprimer entrée
            div.querySelector('.delete-btn').addEventListener('click', () => {
                if (!confirm('Supprimer cette séance ?')) return;
                removeHistoryEntry(entry.id);
            });

            historyListDiv.appendChild(div);
        });
    }

    // Supprimer entrée historique
    function removeHistoryEntry(id) {
        const historyRaw = localStorage.getItem('workoutHistory');
        let history = [];
        if (historyRaw) {
            try { history = JSON.parse(historyRaw) } catch { }
        }
        history = history.filter(e => e.id !== id);
        localStorage.setItem('workoutHistory', JSON.stringify(history));
        loadHistory();
    }

    // Sauvegarde dans historique
    function saveSessionToHistory() {
        const currentSessionRaw = localStorage.getItem('currentWorkout');
        if (!currentSessionRaw) return;
        let currentSession;
        try {
            currentSession = JSON.parse(currentSessionRaw);
        } catch {
            return;
        }

        const endTime = Date.now();
        const historyRaw = localStorage.getItem('workoutHistory');
        let history = [];
        if (historyRaw) {
            try { history = JSON.parse(historyRaw); } catch { }
        }
        const id = Date.now();

        const entry = {
            id,
            sessionKey: currentSession.sessionKey,
            startTime: currentSession.startTime,
            endTime,
            manualExercises: currentSession.manualExercises,
            exercisesData: currentSession.exercisesData,
        };

        history.push(entry);
        localStorage.setItem('workoutHistory', JSON.stringify(history));
    }

    // Rendu édition séance dans historique
    function renderEditSession(entry, container, entryDiv, history) {
        container.innerHTML = '';
        const durationStr = formatDuration(entry.endTime - entry.startTime);

        const form = document.createElement('form');
        form.style.marginTop = '10px';

        // Modifier temps début/fin (juste durée ici)
        form.innerHTML = `
        <label>Durée (HH:MM:SS) : <input type="text" id="edit-duration" value="${durationStr}" disabled /></label><br />
        <label>Exercices manuels (séparés par virgules) :</label><br />
        <input type="text" id="edit-manual-exercises" value="${entry.manualExercises.join(', ')}" style="width:100%" /><br />
        <div id="edit-exercises-container"></div>
        <div class="edit-buttons">
          <button type="submit">Sauvegarder</button>
          <button type="button" class="cancel-btn">Annuler</button>
        </div>
      `;

        container.appendChild(form);

        const editExercisesContainer = form.querySelector('#edit-exercises-container');

        // Affiche formulaire par exercice (chaque série éditable)
        entry.exercisesData.forEach((series, idx) => {
            const divEx = document.createElement('div');
            divEx.classList.add('editable-exercise');
            divEx.innerHTML = `<strong>Exercice ${idx + 1} :</strong>`;

            series.forEach((serie, sidx) => {
                const repsInput = document.createElement('input');
                repsInput.className = 'editable-input reps-input';
                repsInput.type = 'number';
                repsInput.min = 0;
                repsInput.value = serie.reps || '';
                repsInput.placeholder = 'Rép';

                const weightInput = document.createElement('input');
                weightInput.className = 'editable-input weight-input';
                weightInput.type = 'number';
                weightInput.min = 0;
                weightInput.step = 0.1;
                weightInput.value = serie.weight || '';
                weightInput.placeholder = 'Poids';

                divEx.appendChild(document.createTextNode(` Série ${sidx + 1}: `));
                divEx.appendChild(repsInput);
                divEx.appendChild(weightInput);
            });
            editExercisesContainer.appendChild(divEx);
        });

        // Annuler
        form.querySelector('.cancel-btn').addEventListener('click', e => {
            e.preventDefault();
            container.style.display = 'none';
        });

        // Sauvegarder édition
        form.addEventListener('submit', e => {
            e.preventDefault();
            // Mise à jour données dans history
            // récup manuels
            const newManuals = form.querySelector('#edit-manual-exercises').value
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);

            // récup séries modifiées
            const editedExercisesData = [];
            const exercisesBlocks = editExercisesContainer.querySelectorAll('.editable-exercise');
            exercisesBlocks.forEach(divEx => {
                const series = [];
                const repsInputs = divEx.querySelectorAll('.reps-input');
                const weightInputs = divEx.querySelectorAll('.weight-input');
                for (let i = 0; i < repsInputs.length; i++) {
                    series.push({
                        reps: repsInputs[i].value.trim(),
                        weight: weightInputs[i].value.trim(),
                    });
                }
                editedExercisesData.push(series);
            });

            // Trouve entrée dans history
            const idx = history.findIndex(e => e.id === entry.id);
            if (idx === -1) return alert('Erreur: séance non trouvée');

            history[idx].manualExercises = newManuals;
            history[idx].exercisesData = editedExercisesData;

            localStorage.setItem('workoutHistory', JSON.stringify(history));
            loadHistory();
            container.style.display = 'none';
        });
    }

    // === ÉVÉNEMENTS ===

    // Activation bouton start
    sessionSelect.addEventListener('change', () => {
        startStopBtn.disabled = !sessionSelect.value;
    });

    startStopBtn.addEventListener('click', () => {
        toggleSession();
    });

    addManualBtn.addEventListener('click', () => {
        addManualExercise(manualExerciseInput.value);
    });

    exercisesContainer.addEventListener('input', () => {
        if (timerInterval !== null) saveCurrentSession();
    });

    // RESTAURATION SESSION ACTUELLE AU DEMARRAGE

    function restoreSession() {
        const currentSession = loadCurrentSession();
        if (!currentSession) return;

        startTime = currentSession.startTime;
        manualExercises = currentSession.manualExercises || [];
        sessionSelect.value = currentSession.sessionKey || '';
        if (!sessionSelect.value) return;

        sessionSelect.disabled = true;
        startStopBtn.textContent = 'Arrêter la séance';
        startStopBtn.disabled = false;
        timerDisplay.style.display = 'block';
        sessionForm.style.display = 'block';
        manualAddDiv.style.display = 'block';

        createForm(predefinedSessions[sessionSelect.value], currentSession.exercisesData);

        timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
    }

    // Init
    restoreSession();
    showPage('workout');

})();
