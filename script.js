document.addEventListener('DOMContentLoaded', () => {
    const predefinedSessions = {
        "Full Body": ["Développé couché", "Squat", "Tractions"],
        "Haut du corps": ["Développé militaire", "Rowing", "Curl biceps"],
        "Bas du corps": ["Soulevé de terre", "Fente", "Mollets debout"]
    };
    const clearStorageBtn = document.getElementById('clear-storage-btn');

    clearStorageBtn.addEventListener('click', () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer toutes les données temporaires ? Cette action est irréversible.")) {
            if (confirm("Confirmez encore : voulez-vous vraiment tout effacer ?")) {
                localStorage.clear();
                alert("Toutes les données ont été supprimées.");
                // Optionnel : actualiser la page pour réinitialiser l'affichage
                location.reload();
            }
        }
    });

    const sessionSelect = document.getElementById("session");
    const sessionForm = document.getElementById("session-form");
    const exercisesContainer = document.getElementById("exercises-container");
    const submitBtn = document.getElementById("submit-btn");
    const downloadBtn = document.getElementById("download-btn");
    function displayHistory() {
        const historyDiv = document.getElementById('history');
        const allData = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');
        historyDiv.innerHTML = '';

        allData.forEach(entry => {
            const date = new Date(entry.date);
            const dateStr = date.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

            const sessionTitle = document.createElement('h3');
            sessionTitle.textContent = `Séance : ${entry.session} - Date : ${dateStr}`;
            historyDiv.appendChild(sessionTitle);

            const exercises = predefinedSessions[entry.session] || [];

            entry.data.forEach((seriesList, exIndex) => {
                const exName = exercises[exIndex] || `Exercice ${exIndex + 1}`;
                let seriesText = seriesList
                    .filter(serie => serie.reps && serie.weight) // filtre séries vides
                    .map(serie => `${serie.reps}x${serie.weight} kg`)
                    .join(' + ');

                if (!seriesText) seriesText = 'Aucune série enregistrée';

                const p = document.createElement('p');
                p.textContent = `${exName} : ${seriesText}`;
                historyDiv.appendChild(p);
            });
        });
    }


    // Remplir la liste des séances dans le <select>
    function populateSessionSelect() {
        sessionSelect.innerHTML = '';
        Object.keys(predefinedSessions).forEach(sessionName => {
            const option = document.createElement('option');
            option.value = sessionName;
            option.textContent = sessionName;
            sessionSelect.appendChild(option);
        });
    }

    // Crée le formulaire avec exercices + séries
    function createForm(exercises) {
        exercisesContainer.innerHTML = '';

        const savedDataRaw = localStorage.getItem('tempWorkout_' + sessionSelect.value);
        const lastSessionRaw = localStorage.getItem('savedWorkouts');
        let savedData = [];
        let lastSession = [];

        if (savedDataRaw) {
            try { savedData = JSON.parse(savedDataRaw); } catch { savedData = []; }
        }

        if (lastSessionRaw) {
            try {
                const all = JSON.parse(lastSessionRaw);
                for (let i = all.length - 1; i >= 0; i--) {
                    if (all[i].session === sessionSelect.value) {
                        lastSession = all[i].data;
                        break;
                    }
                }
            } catch {
                lastSession = [];
            }
        }

        exercises.forEach((ex, i) => {
            const divEx = document.createElement('div');
            divEx.classList.add('exercise-block');
            divEx.innerHTML = `<label><strong>${ex} :</strong></label>`;

            const seriesContainer = document.createElement('div');
            seriesContainer.classList.add('series-container');

            const seriesData = savedData[i] || [{ weight: '', reps: '' }];
            const lastSeries = (lastSession[i] && lastSession[i].length > 0)
                ? lastSession[i][lastSession[i].length - 1]
                : null;

            function addSerie(weight = '', reps = '', serieIndex = 0) {
                const serieDiv = document.createElement('div');
                serieDiv.classList.add('serie');

                // Récupérer les données de la même série dans la dernière séance (si existante)
                const lastSerieData = (lastSession[i] && lastSession[i][serieIndex]) ? lastSession[i][serieIndex] : null;

                // Placeholders avec valeurs précédentes ou par défaut
                const placeholderReps = lastSerieData ? `${lastSerieData.reps} reps` : 'Répétitions';
                const placeholderWeight = lastSerieData ? `${lastSerieData.weight} kg` : 'Poids (kg)';

                // Champs avec reps puis poids (ordre inversé)
                serieDiv.innerHTML = `
                      <input type="number" step="1" min="0" placeholder="${placeholderReps}" class="reps" value="${reps}" />
                      <input type="number" step="0.1" min="0" placeholder="${placeholderWeight}" class="weight" value="${weight}" />
                    `;

                // Bouton supprimer série
                const btnRemove = document.createElement('button');
                btnRemove.type = 'button';
                btnRemove.textContent = '−';
                btnRemove.title = "Supprimer cette série";
                btnRemove.style.marginLeft = '8px';
                btnRemove.style.backgroundColor = '#dc3545';
                btnRemove.style.fontWeight = 'bold';
                btnRemove.style.color = 'white';
                btnRemove.style.border = 'none';
                btnRemove.style.borderRadius = '50%';
                btnRemove.style.width = '28px';
                btnRemove.style.height = '28px';
                btnRemove.style.cursor = 'pointer';

                btnRemove.addEventListener('click', () => {
                    serieDiv.remove();
                    if (seriesContainer.children.length === 0) addSerie();
                    saveTempData();
                });

                serieDiv.appendChild(btnRemove);
                seriesContainer.appendChild(serieDiv);
            }



            seriesData.forEach((serie, serieIndex) => addSerie(serie.weight, serie.reps, serieIndex));

            const btnAdd = document.createElement('button');
            btnAdd.type = 'button';
            btnAdd.textContent = 'Ajouter une série';
            btnAdd.addEventListener('click', () => addSerie());

            const btnCopy = document.createElement('button');
            btnCopy.type = 'button';
            btnCopy.textContent = 'Copier';
            btnCopy.style.marginLeft = '10px';
            btnCopy.addEventListener('click', () => {
                const allSeries = seriesContainer.querySelectorAll('.serie');
                if (allSeries.length === 0) {
                    addSerie();
                    return;
                }
                const lastSerie = allSeries[allSeries.length - 1];
                const lastWeight = lastSerie.querySelector('.weight').value;
                const lastReps = lastSerie.querySelector('.reps').value;
                addSerie(lastWeight, lastReps);
                saveTempData();
            });

            divEx.appendChild(seriesContainer);
            divEx.appendChild(btnAdd);
            divEx.appendChild(btnCopy);

            exercisesContainer.appendChild(divEx);
        });
    }
    displayHistory();


    function saveTempData() {
        const exercises = predefinedSessions[sessionSelect.value];
        const tempData = exercises.map((ex, i) => {
            const exDiv = exercisesContainer.children[i];
            const series = [...exDiv.querySelectorAll('.serie')].map(serieDiv => {
                const weight = serieDiv.querySelector('.weight').value || '';
                const reps = serieDiv.querySelector('.reps').value || '';
                return { weight, reps };
            });
            return series.length > 0 ? series : [{ weight: '', reps: '' }];
        });

        localStorage.setItem('tempWorkout_' + sessionSelect.value, JSON.stringify(tempData));
    }

    sessionForm.addEventListener('input', saveTempData);

    submitBtn.addEventListener('click', () => {
        const exercises = predefinedSessions[sessionSelect.value];
        const workoutData = exercises.map((ex, i) => {
            const exDiv = exercisesContainer.children[i];
            return [...exDiv.querySelectorAll('.serie')]
                .map(serieDiv => {
                    const weight = serieDiv.querySelector('.weight').value.trim();
                    const reps = serieDiv.querySelector('.reps').value.trim();
                    return { weight, reps };
                })
                .filter(serie => {
                    // On garde seulement les séries avec reps > 0 ET weight > 0
                    return serie.reps !== '' && serie.weight !== '' && Number(serie.reps) > 0 && Number(serie.weight) > 0;
                });
        });


        const allData = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');
        allData.push({
            date: new Date().toISOString(),
            session: sessionSelect.value,
            data: workoutData
        });
        localStorage.setItem('savedWorkouts', JSON.stringify(allData));
        localStorage.removeItem('tempWorkout_' + sessionSelect.value);
        alert("Séance enregistrée !");
        displayHistory();

    });

    downloadBtn.addEventListener('click', () => {
        const allData = localStorage.getItem('savedWorkouts');
        const blob = new Blob([allData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "workouts.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // Init page
    populateSessionSelect();
    createForm(predefinedSessions[sessionSelect.value]);
});
