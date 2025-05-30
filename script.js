// Liste des exercices prédéfinis
const predefinedExercises = [
  "Squat",
  "Développé couché",
  "Tractions",
  "Soulevé de terre",
  "Rowing"
];

const exercisesContainer = document.getElementById('exercisesContainer');
const sessionForm = document.getElementById('sessionForm');
const historyDiv = document.getElementById('history');
const downloadBtn = document.getElementById('downloadBtn');

// Chargement des séances sauvegardées
let sessions = JSON.parse(localStorage.getItem('sessions')) || [];

// Création du formulaire avec les exercices
function createForm() {
  exercisesContainer.innerHTML = '';
  predefinedExercises.forEach((ex, i) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label>${ex} :</label>
      <input type="number" step="0.1" min="0" placeholder="Poids (kg)" name="weight-${i}" />
      <input type="number" step="1" min="0" placeholder="Répétitions" name="reps-${i}" />
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
    let html = `<h3>Séance du ${date.toLocaleString()}</h3><ul>`;
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
createForm();
displayHistory();

sessionForm.addEventListener('submit', e => {
  e.preventDefault();
  const formData = new FormData(sessionForm);
  const sessionData = predefinedExercises.map((ex, i) => {
    let weightRaw = formData.get(`weight-${i}`);
    let repsRaw = formData.get(`reps-${i}`);

    // Conversion et validation
    let weight = weightRaw ? parseFloat(weightRaw) : null;
    let reps = repsRaw ? parseInt(repsRaw, 10) : null;

    if (weight !== null && (isNaN(weight) || weight < 0)) weight = null;
    if (reps !== null && (isNaN(reps) || reps < 0)) reps = null;

    return { exercise: ex, weight, reps };
  });

  // Enregistre la séance avec date
  sessions.push({ date: new Date().toISOString(), data: sessionData });
  localStorage.setItem('sessions', JSON.stringify(sessions));

  // Reset form et rafraîchir affichage
  sessionForm.reset();
  displayHistory();
});

downloadBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sessions, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "sessions_workout.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});
