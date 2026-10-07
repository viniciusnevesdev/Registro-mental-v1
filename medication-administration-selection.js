/* Seleção única e resiliente para o formulário de administração da Beta. */
(() => {
  'use strict';

  let selectionRequest = 0;

  function administrationFormIsOpen(input) {
    const form = document.getElementById('form');
    const backdrop = document.getElementById('backdrop');
    return currentType === 'medication'
      && backdrop?.classList.contains('open')
      && input?.isConnected
      && document.getElementById('medName') === input
      && input.closest('#form') === form;
  }

  window.selectMedicationForAdministration = async function selectMedicationForAdministration(medicationId) {
    const input = document.getElementById('medName');
    const request = ++selectionRequest;
    const medications = await allMedications();
    const medication = medications.find(item => item.id === medicationId);

    if (!medication || request !== selectionRequest || !administrationFormIsOpen(input)) return false;

    const presentationField = document.getElementById('presentationField');
    const presentationSelect = document.getElementById('presentationSelect');
    if (!presentationField || !presentationSelect) return false;

    const presentations = medication.presentations || [];
    const previousPresentationId = selectedMedicationId === medication.id ? selectedPresentationId : null;
    selectedMedicationId = medication.id;
    input.value = medicationDisplay(medication);
    presentationField.classList.remove('hidden');
    presentationSelect.innerHTML = presentationOptions(medication);

    selectedPresentationId = presentations.length === 1
      ? presentations[0].id
      : presentations.some(presentation => presentation.id === previousPresentationId)
        ? previousPresentationId
        : null;
    presentationSelect.value = selectedPresentationId || '';
    presentationSelect.onchange = async () => {
      if (!administrationFormIsOpen(input)) return;
      selectedPresentationId = presentationSelect.value || null;
      await renderDoseFields(document.querySelector('#doseMode .selected')?.dataset.doseMode || 'perUnit');
    };

    await renderDoseFields(document.querySelector('#doseMode .selected')?.dataset.doseMode || 'perUnit');
    return true;
  };

  document.addEventListener('click', event => {
    if (currentType !== 'medication') return;

    const choice = event.target.closest('#medAutocomplete [data-med-choice]');
    const suggestion = event.target.closest('#timeMedSuggestion[data-med-id]');
    const medicationId = choice?.dataset.medChoice || suggestion?.dataset.medId;
    if (!medicationId) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById('medAutocomplete')?.classList.add('hidden');
    void window.selectMedicationForAdministration(medicationId);
  }, true);
})();
