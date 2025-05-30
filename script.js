// Séances prédéfinies avec leurs exercices
const predefinedSessions = {
  "Full Body": ["Squat", "Développé couché", "Tractions", "Soulevé de terre", "Rowing"],
  "Pecs / Dos": ["Développé couché", "Tractions", "Rowing", "Pompes"],
  "Jambes": ["Squat", "Fentes", "Soulevé de terre jambes tendues", "Presse à cuisses"]
};

const sessionSelect = document.getElementById('sessionSelect');
const exercisesContainer = document.getElementById('exercisesContainer');
const sessionForm = document.getElementById('sessionForm');
const historyDiv = document.getElementById('history');
const downloadBtn = document.getElementById('downloadBtn');

// Chargement des séances sauvegardées
let sessions = JSON.parse(localStorage.getItem('sessions')) || [];

// Remplir le select avec les séances
function populateSessionSelect() {
  sessionSelect.innerHTML = '';
  for (const sessionName in predefinedSessions) {
    const option = document.createElement('option');
    option.value = sessionName;
    option.textContent = sessionName;
    sessionSelect.appendChild(option);
  }
}

// Créer le formulaire pour les exercices sélectionnés et restaurer données temporaires
function createForm(exercises) {
  exercisesContainer.innerHTML = '';

  // Charger données sauvegardées temporaires
  const savedDataRaw = localStorage.getItem('tempWorkout_' + sessionSelect.value);
  let savedData = [];
  if (savedDataRaw) {
    try {
      savedData = JSON.parse(savedDataRaw);
    } catch {
      savedData = [];
    }
  }

  exercises.forEach((ex, i) => {
    const weightVal = savedData[i]?.weight || '';
    const repsVal = savedData[i]?.reps || '';
    const div = document.createElement('div');
    div.innerHTML = `
      <label>${ex} :</label>
      <input type="number" step="0.1" min="0" placeholder="Poids (kg)" name="weight-${i}" value="${weightVal}" />
      <input type="number" step="1" min="0" placeholder="Répétitions" name="reps-${i}" value="${repsVal}" />
    `;
    exercisesContainer.appendChild(div);
  });
}

// Affichage de l'historique
function displayHistory() {
  historyDiv.innerHTML = '';
  if (sessions.length === 0) {
    historyDiv.textContent = "Aucune séance enregistrée.";
    return;
  }
  sessions.forEach((session, index) => {
    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'session';
    const date = new Date(session.date);
    let html = `<h3>Séance "${session.sessionName}" du ${date.toLocaleString()}</h3><ul>`;
    session.data.forEach(item => {
      if (item.weight === null && item.reps === null) return;
      html += `<li>${item.exercise} : ${item.weight !== null ? item.weight + ' kg' : '-'} x ${item.reps !== null ? item.reps + ' reps' : '-'}</li>`;
    });
    html += '</ul>';
    sessionDiv.innerHTML = html;
    historyDiv.appendChild(sessionDiv);
  });
}

// Initialisation
populateSessionSelect();
createForm(predefinedSessions[sessionSelect.value]);
displayHistory();

// Met à jour le formulaire quand la séance sélectionnée change
sessionSelect.addEventListener('change', () => {
  createForm(predefinedSessions[sessionSelect.value]);
});

// Sauvegarder automatiquement la saisie dans localStorage (avant validation)
sessionForm.addEventListener('input', () => {
  const formData = new FormData(sessionForm);
  const exercises = predefinedSessions[sessionSelect.value];
  const tempData = exercises.map((ex, i) => {
    let weightRaw = formData.get(`weight-${i}`) || '';
    let repsRaw = formData.get(`reps-${i}`) || '';
    return { weight: weightRaw, reps: repsRaw };
  });
  localStorage.setItem('tempWorkout_' + sessionSelect.value, JSON.stringify(tempData));
});

// Enregistrer la séance (validation finale)
sessionForm.addEventListener('submit', e => {
  e.preventDefault();
  const formData = new FormData(sessionForm);
  const exercises = predefinedSessions[sessionSelect.value];
  const sessionData = exercises.map((ex, i) => {
    let weightRaw = formData.get(`weight-${i}`);
    let repsRaw = formData.get(`reps-${i}`);

    let weight = weightRaw ? parseFloat(weightRaw) : null;
    let reps = repsRaw ? parseInt(repsRaw, 10) : null;

    if (weight !== null && (isNaN(weight) || weight < 0)) weight = null;
    if (reps !== null && (isNaN(reps) || reps < 0)) reps = null;

    return { exercise: ex, weight, reps };
  });

  sessions.push({
    date: new Date().toISOString(),
    sessionName: sessionSelect.value,
    data: sessionData
  });
  localStorage.setItem('sessions', JSON.stringify(sessions));

  // Effacer données temporaires
  localStorage.removeItem('tempWorkout_' + sessionSelect.value);

  sessionForm.reset();
  createForm(predefinedSessions[sessionSelect.value]); // Recharge formulaire vide
  displayHistory();
});

// Télécharger les séances
downloadBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "sessions_workout.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});
