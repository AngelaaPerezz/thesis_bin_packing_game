// Show popup for puzzles 1 and 10, then call callback when closed
window.showPuzzlePopup = function(trialNumber, onClose) {
    // Create overlay
    let overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = 9999;

    // Create popup
    let popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = '#fff';
    popup.style.padding = '2em';
    popup.style.borderRadius = '10px';
    popup.style.boxShadow = '0 2px 16px rgba(0,0,0,0.3)';
    popup.style.textAlign = 'center';
    let msg = trialNumber === 1 ? 'Start of the experiment! Click Continue to begin.' : 'You can now have a short break before starting Puzzle 11. We encourage you to take a short walk. Click Continue when you are ready.';
    popup.innerHTML = `<div style="margin-bottom:1em;">${msg}</div>`;
    let btn = document.createElement('button');
    btn.textContent = 'Continue';
    btn.style.padding = '0.5em 2em';
    btn.style.fontSize = '1.2em';
    btn.onclick = function() {
        document.body.removeChild(overlay);
        if (typeof onClose === 'function') onClose();
    };
    popup.appendChild(btn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
};
// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3
// Copyright (C) 2020-2021 Eklavya Sharma. Licensed under GNU GPLv3.
'use strict';

var undoButton = document.getElementById('undo-button');
var redoButton = document.getElementById('redo-button');
var editForm = document.getElementById('edit-form');
var modalGroup = document.getElementById('modal-group');

var buttonToMenuMap = new Map([
    ['new-game-button', 'ng-menu'],
    // Only add if present in DOM
    ...(document.getElementById('solutions-button') ? [['solutions-button', 'solutions-menu']] : []),
    ...(document.getElementById('auto-pack-button') ? [['auto-pack-button', 'auto-pack-menu']] : []),
    ['participant-button', 'participant-menu'],
    ['questionnaire-button', 'questionnaire-menu'],
    ['export-button', 'export-menu'],
    ['zoom-button', 'zoom-toolbar'],
    ['edit-button', 'edit-form'],
    ['about-button', 'about-menu'],
    ['consent-survey-button', 'consent-survey-menu'],
]);

class DomChooser {
    constructor(yesClass, noClass, activeId=null) {
        this.yesClass = yesClass;
        this.noClass = noClass;
        this.activeId = activeId;
        if(activeId === null) {
            this.activeElem = null;
        }
        else {
            this.activeElem = document.getElementById(activeId);
            console.assert(this.activeElem !== null, 'id ' + id + ' not found in DOM.');
        }
    }

    unset(id=null) {
        if(this.activeId !== null && (id === null || id === this.activeId)) {
            if(this.yesClass) {
                this.activeElem.classList.remove(this.yesClass);
            }
            if(this.noClass) {
                this.activeElem.classList.add(this.noClass);
            }
            this.activeElem = null;
            this.activeId = null;
        }
    }

    _set(id) {
        this.activeId = id;
        this.activeElem = document.getElementById(id);
        console.assert(this.activeElem !== null, 'id ' + id + ' not found in DOM.');
        if(this.yesClass) {
            this.activeElem.classList.add(this.yesClass);
        }
        if(this.noClass) {
            this.activeElem.classList.remove(this.noClass);
        }
    }

    select(id, toggle=false) {
        if(this.activeId === id) {
            if(toggle) {this.unset();}
        }
        else {
            this.unset();
            this._set(id);
        }
    }
}

var toolbarButtonChooser = new DomChooser('pressed', null);
var menuChooser = new DomChooser(null, 'disabled');


// Startup: if no querystring, auto-load participant 1 trial 1
window.addEventListener('DOMContentLoaded', function() {
    const qs = window.location.search;
    if (!qs || qs === '' || qs === '?' || !qs.includes('srctype')) {
        // No querystring or missing srctype, load participant 1 trial 1
        loadParticipantTrials(1);
    }

    // Survey page navigation logic
    const pages = document.querySelectorAll('.survey-page');
    if (pages.length > 0) {
        let currentPage = 0;
        function showPage(idx) {
            pages.forEach((pg, i) => {
                pg.style.display = (i === idx) ? '' : 'none';
            });
            currentPage = idx;
            // Always scroll to top when opening a survey page (robust)
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            // Also scroll the page element itself into view if possible
            if (pages[idx] && typeof pages[idx].scrollIntoView === 'function') {
                pages[idx].scrollIntoView({ behavior: 'auto', block: 'start' });
            }
        }

        // Generic validation for any survey page
        function validateSurveyPageAndMark(page) {
                        console.log('Validating page:', page);
            let firstUnanswered = null;
            let valid = true;
            // Remove old validation messages
            page.querySelectorAll('.survey-inline-validation').forEach(el => el.remove());

            // Helper to add message
            function addMsg(input, msg) {
                let msgDiv = document.createElement('div');
                msgDiv.className = 'survey-inline-validation';
                msgDiv.style.color = 'red';
                msgDiv.style.fontSize = '0.95em';
                msgDiv.style.margin = '0.2em 0 0.2em 0';
                msgDiv.textContent = msg;
                // For radio groups, find the main label that is a sibling of the .radio-group
                let container = input.closest('.input-pair') || input.parentElement;
                let label = null;
                let radioGroup = null;
                if (container) {
                    radioGroup = container.querySelector('.radio-group');
                    if (radioGroup) {
                        // Find the label that is a sibling of the .radio-group
                        let children = Array.from(container.children);
                        let idx = children.indexOf(radioGroup);
                        if (idx > 0 && children[idx-1].tagName === 'LABEL') {
                            label = children[idx-1];
                        }
                    }
                }
                // Fallback: use the label in the parent
                if (!label && container) {
                    label = container.querySelector('label');
                }
                if (label && label.parentElement) {
                    label.parentElement.insertBefore(msgDiv, label.nextSibling);
                } else if (container) {
                    container.appendChild(msgDiv);
                } else if (input.parentElement) {
                    input.parentElement.appendChild(msgDiv);
                } else {
                    input.after(msgDiv);
                }
            }

            // Make all questions mandatory except those starting with 'If applicable' and 'Any further remarks?'
            const inputPairs = page.querySelectorAll('.input-pair');
            inputPairs.forEach(pair => {
                const label = pair.querySelector('label');
                if (!label) return;
                const labelText = label.textContent.trim().toLowerCase();
                if (
                    labelText.startsWith('if applicable') ||
                    labelText.startsWith('any further remarks') ||
                    labelText.startsWith('if you selected')
                ) return;
                const textInput = pair.querySelector('input[type="text"]');
                const radioGroup = pair.querySelector('.radio-group');
                let hasRadio = false, hasText = false;
                if (radioGroup) {
                    const radios = radioGroup.querySelectorAll('input[type="radio"]');
                    if (radios.length > 0) {
                        hasRadio = Array.from(radios).some(r => r.checked);
                    }
                }
                if (textInput && textInput.value.trim()) {
                    hasText = true;
                }
                // If both present, only require one
                if (radioGroup && textInput) {
                    if (!hasRadio && !hasText) {
                        addMsg(radioGroup.querySelector('input[type="radio"]') || textInput, 'This question must be answered.');
                        if (!firstUnanswered) firstUnanswered = radioGroup.querySelector('input[type="radio"]') || textInput;
                        valid = false;
                    }
                } else if (radioGroup) {
                    if (!hasRadio) {
                        const radios = radioGroup.querySelectorAll('input[type="radio"]');
                        if (radios.length > 0) {
                            addMsg(radios[0], 'This question must be answered.');
                            if (!firstUnanswered) firstUnanswered = radios[0];
                            valid = false;
                        }
                    }
                } else if (textInput) {
                    if (!hasText) {
                        addMsg(textInput, 'This question must be answered.');
                        if (!firstUnanswered) firstUnanswered = textInput;
                        valid = false;
                    }
                }
            });
            return {valid, firstUnanswered};
        }

        // Attach validation to all next buttons on all pages
        pages.forEach((page, idx) => {
            const nextBtn = page.querySelector('.next-btn');
            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    console.log('Next button clicked on page', idx);
                    e.preventDefault();
                    e.stopPropagation();
                    const {valid, firstUnanswered} = validateSurveyPageAndMark(page);
                    console.log('Validation result:', valid, firstUnanswered);
                    if (!valid) {
                        console.log('Validation failed:');
                        if (firstUnanswered && typeof firstUnanswered.scrollIntoView === 'function') {
                            firstUnanswered.scrollIntoView({behavior: 'smooth', block: 'center'});
                            firstUnanswered.focus();
                        }
                        return;
                    }
                    if (currentPage < pages.length - 1) showPage(currentPage + 1);
                });
            }
        });
        // Previous buttons remain unchanged
        document.querySelectorAll('.prev-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentPage > 0) showPage(currentPage - 1);
            });
        });
        showPage(0);
    }
    // Consent survey page navigation logic
    const consentPages = document.querySelectorAll('.consent-survey-page');
    if (consentPages.length > 0) {
        let consentCurrentPage = 0;
        function showConsentPage(idx) {
            consentPages.forEach((pg, i) => {
                pg.style.display = (i === idx) ? '' : 'none';
            });
            consentCurrentPage = idx;
        }
        document.querySelectorAll('.next-btn.survey-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (consentCurrentPage < consentPages.length - 1) showConsentPage(consentCurrentPage + 1);
            });
        });
        document.querySelectorAll('.prev-btn.survey-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (consentCurrentPage > 0) showConsentPage(consentCurrentPage - 1);
            });
        });
        showConsentPage(0);
    }

    // Consent survey submit handler
    const consentForm = document.getElementById('consent-survey-menu');
    if (consentForm) {
        consentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const consentChecked = document.getElementById('consent-checkbox').checked;
            if (!consentChecked) {
                alert('You must give consent to proceed.');
                return;
            }
            // Get participant ID
            let participantId = (typeof participantIdSelected !== 'undefined' && participantIdSelected !== null) ? participantIdSelected : 'unknown';
            // Prepare confirmation content
            const dateStr = new Date().toISOString().slice(0, 10);
            const confirmation = {
                participantId: participantId,
                date: dateStr,
                consentGiven: true,
                message: 'Participant gave consent for the study.'
            };
            const blob = new Blob([JSON.stringify(confirmation, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `consent-confirmation-participant-${participantId}-${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            consentForm.classList.add('disabled');
            alert('Thank you for your consent! Confirmation downloaded.');
        });
        // Add event listener to toolbar button to open modal
        var consentSurveyButton = document.getElementById('consent-survey-button');
        if (consentSurveyButton) {
            consentSurveyButton.addEventListener('click', function() {
                toggleFromToolbar('consent-survey-button');
            });
        }
    }
    // Dynamically insert picture questions for the current participant
    function insertPictureQuestions(participantId) {
        const anchor = document.getElementById('picture-questions-anchor');
        if (!anchor) return;
        anchor.innerHTML = '';
        if (!participantId) return;
        // Add introduction paragraph in bold
        const intro = document.createElement('p');
        intro.className = 'survey-section-text';
        intro.textContent = 'The following are pictures of 4 puzzles that you encountered during the experiment. Please recall, to the best of your ability, what your strategy or thought process was to solve each puzzle.';
        anchor.appendChild(intro);
        for (let i = 1; i <= 4; i++) {
            const div = document.createElement('div');
            div.className = 'input-pair';
            const label = document.createElement('label');
            label.textContent = `Puzzle ${i}:`;
            const img = document.createElement('img');
            img.src = `pictures/participant_${participantId}/picture_${i}.png`;
            img.alt = `Participant ${participantId} Picture ${i}`;
            img.className = 'survey-image';
            const input = document.createElement('input');
            input.name = `puzzle_${i}_strategy`;
            input.type = 'text';
            input.placeholder = 'Describe your thought process…';
            div.appendChild(label);
            div.appendChild(img);
            div.appendChild(input);
            anchor.appendChild(div);
        }
    }

    // When participant is loaded, insert picture questions
    window.insertPictureQuestions = insertPictureQuestions;

    // Allow pressing Enter in participant ID input to trigger Load participant
    const participantInput = document.getElementById('participant-id');
    const participantLoadBtn = document.getElementById('participant-load');
    if (participantInput && participantLoadBtn) {
        participantInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                participantLoadBtn.click();
            }
        });
    }
});


function toggleFromToolbar(buttonId) {
    if (document.getElementById(buttonId)) {
        toolbarButtonChooser.select(buttonId, true);
    }
    const menuId = buttonToMenuMap.get(buttonId) || null;
    if (menuId && document.getElementById(menuId)) {
        menuChooser.select(menuId, true);
    }
}
function unsetToolbar(buttonId=null) {
    const menuId = buttonToMenuMap.get(buttonId) || null;
    if (buttonId && document.getElementById(buttonId)) {
        toolbarButtonChooser.unset(buttonId);
    }
    if (menuId && document.getElementById(menuId)) {
        menuChooser.unset(menuId);
    }
}

function getPersistentHeaderHeight() {
    return document.getElementById('main-toolbar').getBoundingClientRect().height;
}

var participantTrialList = null;
var participantTrialIndex = -1;
var participantIdSelected = null;

function parseExperimentTrialsCsv(csvText) {
    let lines = csvText.trim().split(/\r?\n/);
    if(lines.length < 2) { return []; }
    let headers = lines[0].split(',').map(x => x.trim());
    let rows = [];
    for(let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if(line === '') { continue; }
        let cols = line.split(',');
        if(cols.length !== headers.length) { continue; }
        let row = {};
        for(let j = 0; j < headers.length; j++) {
            row[headers[j]] = cols[j].trim();
        }
        rows.push(row);
    }
    return rows;
}


// Modified to support practice trial
// Expose participantTrialIndex and isParticipantMode globally for popup logic
window.participantTrialIndex = participantTrialIndex;
window.isParticipantMode = isParticipantMode;

function loadParticipantTrialByIndex(index) {
    // If index is -2 or -1, show the practice trials in order
    if (index === -2 || index === -1) {
        participantTrialIndex = index;
    window.participantTrialIndex = participantTrialIndex;
        const practiceNum = (index === -2) ? 1 : 2;
        const stimulusFile = `experiment_puzzles/final_selection/practice-trial-${practiceNum}.json`;
        if (modalGroup) modalGroup.classList.add('loading');
        fetch(stimulusFile)
            .then(resp => {
                if (!resp.ok) throw new Error('HTTP status ' + resp.status);
                return resp.json();
            })
            .then(level => {
                loadGameFromRawLevel(level, null,
                    function() {
                        if (modalGroup) modalGroup.classList.remove('loading');
                        if (typeof game !== 'undefined' && game !== null) {
                            game.won = false;
                            game.putBack();
                        }
                        // Label as Practice Trial 1 or 2
                        updateCurrentPuzzle('Practice ' + practiceNum);
                        timerBox.style.display = 'none';
                        if (trialTimer) clearInterval(trialTimer);
                    },
                    function(err) {
                        if (modalGroup) modalGroup.classList.remove('loading');
                        addMsg('error', 'Could not load practice trial: ' + err);
                    }
                );
            })
            .catch(err => {
                if (modalGroup) modalGroup.classList.remove('loading');
                addMsg('error', 'Could not load practice trial file: ' + stimulusFile + ' ; ' + err);
            });
        return;
    }
    // Otherwise, show the real trials as before
    if(!participantTrialList || index < 0 || index >= participantTrialList.length) {
        addMsg('error', 'Announced participant trial index invalid: ' + index);
        return;
    }
    participantTrialIndex = index;
    window.participantTrialIndex = participantTrialIndex;
    const trial = participantTrialList[index];
    const stimulus = Number(trial.stimulus);
    if(Number.isNaN(stimulus)) {
        addMsg('error', 'Stimulus value in trial is not a number: ' + trial.stimulus);
        return;
    }
    const stimulusFile = 'experiment_puzzles/final_selection/' + String(stimulus).padStart(3, '0') + '.json';
    var cond = (trial.condition || '').toUpperCase();
    modalGroup.classList.add('loading');
    fetch(stimulusFile)
        .then(resp => {
            if (!resp.ok) throw new Error('HTTP status ' + resp.status);
            return resp.json();
        })
        .then(level => {
            // Attach condition to level so it is always available in logs
            level.condition = cond;
            if (cond === 'A' || cond === 'C') {
                if (Array.isArray(level.bins)) {
                    for (let bin of level.bins) {
                        bin.xLen = (bin.xLen || 0) + 1;
                        bin.yLen = (bin.yLen || 0) + 1;
                    }
                } else if (typeof level.binXLen === 'number' && typeof level.binYLen === 'number') {
                    level.binXLen += 1;
                    level.binYLen += 1;
                }
            }
            loadGameFromRawLevel(level, null,
                function() {
                    modalGroup.classList.remove('loading');
                    if (typeof game !== 'undefined' && game !== null) {
                        game.won = false;
                        game.putBack();
                    }
                    updateCurrentPuzzle(trial.Trial);
                    // Only start the countdown after popup for 1st and 11th real trial
                    if ((participantTrialIndex === 0 || participantTrialIndex === 10) && typeof window.showPuzzlePopup === 'function') {
                        // Hide countdown and stats bar time while popup is open
                        if (timerBox) timerBox.style.display = 'none';
                        if (game && game.statsDomElems && game.statsDomElems['time']) {
                            game.statsDomElems['time'].innerHTML = '';
                        }
                        window.showPuzzlePopup(participantTrialIndex + 1, () => {
                            // Show countdown and stats bar time after popup is closed
                            if (cond === 'A' || cond === 'B') {
                                startTrialTimer(60);
                            } else if (cond === 'C' || cond === 'D') {
                                startTrialTimer(180);
                            } else {
                                timerBox.style.display = 'none';
                                if (trialTimer) clearInterval(trialTimer);
                            }
                            if (typeof game !== 'undefined' && game !== null && typeof game._startTimer === 'function') {
                                game._startTimer();
                            }
                        });
                    } else {
                        if (typeof game !== 'undefined' && game !== null && typeof game._startTimer === 'function') {
                            game._startTimer();
                        }
                        if (cond === 'A' || cond === 'B') {
                            startTrialTimer(60);
                        } else if (cond === 'C' || cond === 'D') {
                            startTrialTimer(180);
                        } else {
                            timerBox.style.display = 'none';
                            if (trialTimer) clearInterval(trialTimer);
                        }
                    }
                },
                function(err) {
                    modalGroup.classList.remove('loading');
                    addMsg('error', 'Could not load stimulus: ' + err);
                }
            );
        })
        .catch(err => {
            modalGroup.classList.remove('loading');
            addMsg('error', 'Could not load stimulus file: ' + stimulusFile + ' ; ' + err);
        });
}

function loadParticipantTrials(participantId) {
    participantId = Number(participantId);
    if(Number.isNaN(participantId) || participantId < 1 || participantId > 40) {
        addMsg('error', 'Participant ID must be 1-40');
        return;
    }
    fetch('experiment_trials.csv').then(resp => {
        if(!resp.ok) {
            throw new Error('HTTP status ' + resp.status);
        }
        return resp.text();
    }).then(text => {
        let allTrials = parseExperimentTrialsCsv(text);
        let trials = allTrials.filter(r => Number(r.participant) === participantId);
        if(trials.length === 0) {
            addMsg('error', 'No trials found for participant ' + participantId);
            return;
        }
        trials.sort((a,b) => Number(a.Trial) - Number(b.Trial));
        participantTrialList = trials;
        participantTrialIndex = -2; // Start at first practice trial
        participantIdSelected = participantId;
        // Insert picture questions for this participant
        insertPictureQuestions(participantId);
        document.getElementById('packing-area').classList.add('participant-mode');
        // Update participant display
        const participantStatus = document.getElementById('participant-status');
        if (participantStatus) {
            participantStatus.textContent = 'Current participant: ' + participantId;
        }
        const toolbarStatus = document.getElementById('participant-toolbar-status');
        if (toolbarStatus) {
            toolbarStatus.textContent = 'Participant: ' + participantId;
        }
        // addMsg('success', 'Loaded participant ' + participantId + ' with ' + trials.length + ' trials.');
        loadParticipantTrialByIndex(-2); // Show first practice trial
    }).catch(err => {
        addMsg('error', 'Could not load experiment_trials.csv: ' + err.message);
    });
}

function isParticipantMode() {
    return participantTrialList && participantTrialList.length > 0;
}

function resetParticipantMode() {
    participantTrialList = null;
    participantTrialIndex = -1;
    window.participantTrialIndex = participantTrialIndex;
    participantIdSelected = null;
    const pa = document.getElementById('packing-area');
    if (pa) { pa.classList.remove('participant-mode'); }
}


function participantNextTrial() {
    if(!isParticipantMode()) {
        return false;
    }
    // If currently at first practice trial, go to second practice trial
    if(participantTrialIndex === -2) {
        loadParticipantTrialByIndex(-1);
    } else if(participantTrialIndex === -1) {
        loadParticipantTrialByIndex(0);
    } else if(participantTrialIndex < participantTrialList.length - 1) {
        loadParticipantTrialByIndex(participantTrialIndex + 1);
    } else {
        addMsg('info', 'Already at last participant trial.');
    }
    return true;
}

function leaveParticipantMode() {
    resetParticipantMode();
    // Clear participant display
    const participantStatus = document.getElementById('participant-status');
    if (participantStatus) {
        participantStatus.textContent = 'No participant loaded.';
    }
    const toolbarStatus = document.getElementById('participant-toolbar-status');
    if (toolbarStatus) {
        toolbarStatus.textContent = 'No participant loaded.';
    }
    addMsg('info', 'Participant mode disabled: normal level navigation restored.');
}


function participantPrevTrial() {
    if(!isParticipantMode()) {
        return false;
    }
    // If currently at first real trial, go back to second practice trial
    if(participantTrialIndex === 0) {
        loadParticipantTrialByIndex(-1);
    } else if(participantTrialIndex === -1) {
        loadParticipantTrialByIndex(-2);
    } else if(participantTrialIndex > 0) {
        loadParticipantTrialByIndex(participantTrialIndex - 1);
    } else {
        addMsg('info', 'Already at first practice trial.');
    }
    return true;
}

function createGenParamsInputs(genName, container) {
    for(const [paramName, param] of levelGenerators.get(genName).paramMap) {
        let div = document.createElement('div');
        div.classList.add('input-pair');
        let id = 'ng-gen-' + genName + '-param-' + paramName;
        let labelElem = document.createElement('label');
        labelElem.innerHTML = paramName;
        labelElem.setAttribute('for', id);
        div.appendChild(labelElem);

        let inputElem = document.createElement('input');
        inputElem.setAttribute('type', 'text');
        inputElem.setAttribute('id', id);
        inputElem.setAttribute('name', paramName);
        inputElem.setAttribute('autocomplete', 'off');
        if(param.defaultValue !== null) {
            inputElem.setAttribute('placeholder', param.defaultValue);
        }
        div.appendChild(inputElem);
        inputElem.addEventListener('focus', () => {handleKeyPresses = false;});
        inputElem.addEventListener('blur', () => {handleKeyPresses = true;});

        if(param.options !== null) {
            let datalist = document.createElement('datalist');
            const listId = 'ng-gen-paramoptions-' + paramName;
            datalist.setAttribute('id', listId);
            for(const optionName of param.options) {
                let option = document.createElement('option');
                option.setAttribute('value', optionName);
                datalist.appendChild(option);
            }
            inputElem.setAttribute('list', listId);
            div.appendChild(datalist);
        }

        container.appendChild(div);
    }
}

function createGenParamsMenu(genName, menuId) {
    let menu = document.createElement('form');
    menu.setAttribute('id', menuId);
    menu.classList.add('menu', 'disabled');
    let header = document.createElement('header');
    menu.appendChild(header);
    let options = document.createElement('div');
    options.classList.add('options', 'menu-body');
    menu.appendChild(options);
    let submit = document.createElement('button');
    submit.setAttribute('type', 'submit');
    submit.innerHTML = 'Submit';
    menu.appendChild(submit);

    let backBtn = document.createElement('div');
    backBtn.classList.add('back-btn');
    backBtn.addEventListener('click', (ev) => menuChooser.select('ng-gen-menu'));
    header.appendChild(backBtn);
    let heading = document.createElement('div');
    heading.classList.add('heading');
    heading.innerHTML = 'Enter parameters for ' + genName;
    header.appendChild(heading);
    let closeBtn = document.createElement('div');
    closeBtn.classList.add('close-btn');
    header.appendChild(closeBtn);

    createGenParamsInputs(genName, options);

    menu.addEventListener('submit', function(ev) {
        ev.preventDefault();
        let q = {'srctype': 'gen', 'src': genName}
        const formData = new FormData(menu);
        for(let [key, value] of formData.entries()) {
            if(value !== '') {
                q[key] = value;
            }
        }
        const qs = toQueryString(q);
        function succHook() {
            window.history.replaceState({}, null, '?' + qs);
            toolbarButtonChooser.unset('new-game-button');
            menuChooser.unset(menuId);
            modalGroup.classList.remove('loading');
            resetReloadButton();
        }
        modalGroup.classList.add('loading');
        loadGameFromGen(genName, q, null, succHook, toolbarFailHook);
    });
    return menu;
}

function editFormCheckHandler(ev) {
    const formData = new FormData(editForm);
    const keys = ['item', 'bin'];
    for(const key of keys) {
        setMouseMode(key, formData.get('edit-' + key));
    }
}

function toQueryString(obj) {
    let strs = [];
    for(let [key, value] of Object.entries(obj)) {
        strs.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
    }
    return strs.join("&");
}

function showSolutionSuccess() {
    unsetToolbar('solutions-button');
}

function autoPackComplete() {
    unsetToolbar('auto-pack-button');
    modalGroup.classList.remove('loading');
}

function solutionsClickHandler(ev) {
    ev.preventDefault();
    let solnName = ev.target.innerHTML;
    game.selectSolution(solnName);
    showSolutionSuccess();
}

function autoPackClickHandler(ev) {
    ev.preventDefault();
    let algoName = ev.target.innerHTML;
    modalGroup.classList.add('loading');
    window.setTimeout(() => game.selectAutoPack(
        algoName, null, autoPackComplete, autoPackComplete, null));
}

function repopulateSolutionsMenu(solutions) {
    let listDomElem = document.getElementById('solutions-list');
    listDomElem.innerHTML = '';
    let button = document.getElementById('solutions-button');
    if(solutions.size === 0) {
        button.classList.add('disabled');
    }
    else {
        button.classList.remove('disabled');
    }
    for(let key of solutions.keys()) {
        let liElem = document.createElement('li');
        liElem.innerHTML = key;
        liElem.addEventListener('click', solutionsClickHandler);
        listDomElem.appendChild(liElem);
    }
}

function repopulateAutoPackMenu() {
    let listDomElem = document.getElementById('auto-pack-list');
    listDomElem.innerHTML = '';
    let button = document.getElementById('auto-pack-button');
    if(packers.size === 0) {
        button.classList.add('disabled');
    }
    else {
        button.classList.remove('disabled');
    }
    for(let key of packers.keys()) {
        let liElem = document.createElement('li');
        liElem.innerHTML = key;
        liElem.addEventListener('click', autoPackClickHandler);
        listDomElem.appendChild(liElem);
    }
}

function addToolbarEventListeners() {
    document.getElementById('new-game-button').addEventListener('click', function(ev) {
            toggleFromToolbar('new-game-button');
            modalGroup.classList.remove('loading');
        });
    document.getElementById('reload-button').addEventListener('click', function(ev) {
            if(gameLoadParams !== null) {
                toolbarButtonChooser.select('reload-button');
                function succHook() {toolbarButtonChooser.unset('reload-button');}
                function failHook(msg) {succHook(); addMsg('error', msg);}
                loadGameFromQParams(gameLoadParams, succHook, failHook);
            }
        });
    undoButton.addEventListener('click', function(ev) {
            if(game !== null) {game.undo();}
        });
    redoButton.addEventListener('click', function(ev) {
            if(game !== null) {game.redo();}
        });
    document.getElementById('save-game-button').addEventListener('click', function(ev) {
            if(game !== null) {downloadProgress();}
        });
    document.getElementById('share-button').addEventListener('click', function(ev) {
            if(game !== null) {
                function succHook() {addMsg('success', 'URL copied to clipboard');}
                function failHook(reason) {addMsg('error', 'Could not copy URL to clipboard: ' + reason);}
                copyLevelURLToClipboard(succHook, failHook);
            }
        });
    document.getElementById('unpack-button').addEventListener('click', function(ev) {
            let oldPos = game.getItemPositions();
            game.putBack();
            game._recordHistoryCommand({'cmd': 'bulkMove', 'oldPos': oldPos, 'newPos': []});
        });
    let solutionsButton = document.getElementById('solutions-button');
    solutionsButton.addEventListener('click', function(ev) {
            if(!solutionsButton.classList.contains('disabled') && game !== null) {
                if(game.level.solutions.size === 1) {
                    for(const key of game.level.solutions.keys()) {
                        game.selectSolution(key);
                    }
                }
                else {
                    toggleFromToolbar('solutions-button');
                }
            }
        });
    document.getElementById('dark-mode-button').addEventListener('click', function(ev) {
            document.body.classList.toggle('light');
            document.body.classList.toggle('dark');
            document.documentElement.style.setProperty('color-scheme',
                (document.body.classList.contains('dark') ? 'dark' : 'light'));
            try {
                if(window.localStorage.getItem('dark')) {
                    window.localStorage.removeItem('dark');
                }
                else {
                    window.localStorage.setItem('dark', '1');
                }
            }
            catch(e) {
                console.warn('setting localStorage failed: ' + e);
            }
        });
    let onlyToggleIds = ['about-button', 'zoom-button', 'auto-pack-button',
        'participant-button', 'questionnaire-button', 'export-button', 'edit-button'];
    for(const id of onlyToggleIds) {
        document.getElementById(id).addEventListener('click', (ev) => toggleFromToolbar(id));
    }
}

function addZoomEventListeners() {
    document.getElementById('zoom-in-button').addEventListener('click', function(ev) {
            game.resize(game.latentScaleFactor * 1.1);
        });
    document.getElementById('zoom-out-button').addEventListener('click', function(ev) {
            game.resize(game.latentScaleFactor / 1.1);
        });
    document.getElementById('zoom-x-button').addEventListener('click', function(ev) {
            game.resize('x');
        });
    document.getElementById('zoom-y-button').addEventListener('click', function(ev) {
            game.resize('y');
        });
    document.getElementById('zoom-fit-button').addEventListener('click', function(ev) {
            game.resize(null);
        });
}

function addExportEventListeners() {
    document.getElementById('export-li-tikz').addEventListener('click', function(ev) {
            if(game.nBinsUsed === 0) {
                addMsg('error', 'No bins have been used; nothing to export.');
            }
            downloadBinsToTikz();
            unsetToolbar('export-button');
        });
    document.getElementById('export-li-svg').addEventListener('click', function(ev) {
            downloadAsSvg();
            unsetToolbar('export-button');
        });
    document.getElementById('export-li-pdf').addEventListener('click', function(ev) {
            if(game.nBinsUsed === 0) {
                addMsg('error', 'No bins have been used; nothing to export.');
            }
            else {
                document.body.classList.add('show-bins-only');
                window.print();
                setTimeout(function() {document.body.classList.remove('show-bins-only');}, 0);
            }
            unsetToolbar('export-button');
        });
    document.getElementById('export-li-log').addEventListener('click', function(ev) {
            if(game !== null) {
                game.packingLog.downloadLog('packing-log.json');
            }
            unsetToolbar('export-button');
        });
    document.getElementById('export-li-clear-log').addEventListener('click', function(ev) {
            if(game !== null) {
                game.packingLog.clearLog();
                addMsg('success', 'Packing log cleared.');
            }
            unsetToolbar('export-button');
        });
    document.getElementById('export-li-complete-logs').addEventListener('click', function(ev) {
            if(game !== null) {
                game.packingLog.downloadAllTrials('complete-logs.json');
            }
            unsetToolbar('export-button');
        });
}

// Timer box for time-limited trials
var timerBox = document.createElement('div');
timerBox.id = 'trial-timer-box';
timerBox.style.position = 'absolute';
timerBox.style.top = 'auto';
timerBox.style.left = 'auto';
timerBox.style.bottom = '60px';
timerBox.style.right = '10px';
timerBox.style.background = '#222';
timerBox.style.color = '#fff';
timerBox.style.padding = '0.5em 1em';
timerBox.style.fontSize = '1.2em';
timerBox.style.borderRadius = '8px';
timerBox.style.zIndex = '1000';
timerBox.style.display = 'none';
document.body.appendChild(timerBox);

var trialTimer = null;
var trialTimerEnd = null;

function stopGameAndSaveLog() {
    if (typeof game !== 'undefined' && game !== null) {
        timerBox.textContent = 'Time is up!';
        // Ensure trial is finished and included in complete logs
        if (!game.won) {
            game.won = true;
            // Download log with participant and trial info
            let participant = typeof participantIdSelected !== 'undefined' ? participantIdSelected : 'unknown';
            let trialNum = (participantTrialIndex >= 0 && participantTrialList && participantTrialList[participantTrialIndex]) ? participantTrialList[participantTrialIndex].Trial : 'unknown';
            let filename = `packing-log-participant-${participant}-trial-${trialNum}.json`;
            game.packingLog.downloadLog(filename);
            game.packingLog.finishTrial(game.level.trialNumber);
        }
        
    }
}

function startTrialTimer(limitSeconds) {
    if (trialTimer) clearInterval(trialTimer);
    trialTimerEnd = Date.now() + limitSeconds * 1000;
    timerBox.style.display = 'block';
    function updateTimer() {
        if (game && game.won) {
            clearInterval(trialTimer);
            timerBox.style.display = 'none';
            return;
        }
        var remaining = Math.max(0, Math.ceil((trialTimerEnd - Date.now()) / 1000));
        timerBox.textContent = 'Time left: ' + remaining + 's';
        if (remaining <= 0) {
            clearInterval(trialTimer);
            stopGameAndSaveLog();
        }
    }
    updateTimer();
    trialTimer = setInterval(updateTimer, 1000);
}

var menuTraversalList = [
    ['ng-menu', 'ng-hc', 'ng-hc-menu'],
    ['ng-menu', 'ng-gen', 'ng-gen-menu'],
    ['ng-menu', 'ng-json', 'ng-json-menu'],
];

function toolbarFailHook(msg) {
    addMsg('error', msg);
    toolbarButtonChooser.unset();
    menuChooser.unset();
    modalGroup.classList.remove('loading');
}

function addNgMenuEventListeners() {
    for(const [oldMenuId, buttonId, newMenuId] of menuTraversalList) {
        document.getElementById(buttonId).addEventListener('click',
            (ev) => menuChooser.select(newMenuId));
        document.querySelector(`#${newMenuId} .back-btn`).addEventListener('click',
            (ev) => menuChooser.select(oldMenuId));
    }
    function succHookWrapper(menuName, qs) {
        window.history.replaceState({}, null, '?' + qs);
        toolbarButtonChooser.unset('new-game-button');
        menuChooser.unset(menuName);
        modalGroup.classList.remove('loading');
        resetReloadButton();
    }
    document.getElementById('ng-hc-list').addEventListener('click', function(ev) {
        const name = ev.target.getAttribute('data-name');
        const qs = toQueryString({'srctype': 'hc', 'src': name});
        modalGroup.classList.add('loading');
        loadGameFromHC(name, null, () => succHookWrapper('ng-hc-menu', qs), toolbarFailHook);
    });
    document.getElementById('ng-upload').addEventListener('click', function(ev) {
        loadGameFromUpload(null, () => succHookWrapper('ng-menu', ''), toolbarFailHook);
    });
    let textarea = document.getElementById('ng-json-input');
    document.getElementById('ng-json-submit').addEventListener('click', function(ev) {
        let j = textarea.value;
        modalGroup.classList.add('loading');
        loadGameFromJsonString(j, null, () => succHookWrapper('ng-json-menu', ''), toolbarFailHook);
    });
    textarea.addEventListener('focus', () => {handleKeyPresses = false;});
    textarea.addEventListener('blur', () => {handleKeyPresses = true;});

    let genList = document.getElementById('ng-gen-list');
    let modalGroup = document.getElementById('modal-group');
    let modalOverlay = document.getElementById('modal-overlay');
    for(const [genName, gen] of levelGenerators) {
        let liElem = document.createElement('li');
        liElem.setAttribute('data-gen', genName);
        liElem.innerHTML = genName;
        genList.appendChild(liElem);
        const menuId = 'ng-gen-' + genName + '-menu';
        liElem.addEventListener('click', (ev) => menuChooser.select(menuId));

        let menu = createGenParamsMenu(genName, menuId);
        modalGroup.insertBefore(menu, modalOverlay);
    }
}

function addExtraUIEventListeners() {
    addToolbarEventListeners();
    addZoomEventListeners();
    addExportEventListeners();
    addNgMenuEventListeners();

    editForm.addEventListener('change', editFormCheckHandler);
    editForm.addEventListener('input', editFormCheckHandler);

    // Use event delegation for .close-btn elements inside menus/overlays only
    document.addEventListener('click', function(ev) {
        if (
            ev.target.classList.contains('close-btn') &&
            (
                ev.target.closest('.menu') ||
                ev.target.closest('.overlay')
            )
        ) {
            console.log('Menu close button clicked:', ev.target);
            ev.preventDefault();
            ev.stopPropagation();
            unsetToolbar();
            if (typeof menuChooser !== 'undefined' && menuChooser.unset) {
                menuChooser.unset();
            }
        }
    });
    document.querySelector('#modal-group > .overlay').addEventListener('click',
        (ev) => unsetToolbar());

    let questionnaireForm = document.getElementById('questionnaire-menu');
    if (questionnaireForm) {
        questionnaireForm.addEventListener('submit', function(ev) {
            ev.preventDefault();
            let formData = new FormData(questionnaireForm);
            let response = {};
            for (let [key, value] of formData.entries()) {
                if (response[key]) {
                    // support multiselect / repeated values
                    if (!Array.isArray(response[key])) {
                        response[key] = [response[key]];
                    }
                    response[key].push(value);
                } else {
                    response[key] = value;
                }
            }
            response.submittedAt = new Date().toISOString();
            response.level = document.getElementById('current-puzzle-label')?.textContent || null;

            let stored = [];
            try {
                stored = JSON.parse(window.localStorage.getItem('questionnaireResponses') || '[]');
                if (!Array.isArray(stored)) { stored = []; }
            } catch (e) {
                stored = [];
            }
            stored.push(response);
            window.localStorage.setItem('questionnaireResponses', JSON.stringify(stored));

            // Download response as JSON file (with cross-browser fallback)
            let jsonText = JSON.stringify(response, null, 2);
            let filename = 'questionnaire-response-' + response.submittedAt.replace(/[:.]/g, '-') + '.json';
            let blob = new Blob([jsonText], {type: 'application/json'});

            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                // IE/Edge legacy
                window.navigator.msSaveOrOpenBlob(blob, filename);
            } else {
                let url = URL.createObjectURL(blob);
                let anchor = document.createElement('a');
                anchor.style.display = 'none';
                anchor.href = url;
                anchor.download = filename;
                document.body.appendChild(anchor);

                // Chrome/Firefox etc
                let triggered = false;
                try {
                    triggered = anchor.click();
                } catch (e) {
                    console.warn('Download trigger failed by click, using window.open fallback', e);
                }
                if (!triggered) {
                    window.open(url, '_blank');
                }

                setTimeout(function() {
                    document.body.removeChild(anchor);
                    URL.revokeObjectURL(url);
                }, 200);
            }

            addMsg('success', 'Thanks for your input! Questionnaire saved locally (' + stored.length + ' total) and downloaded.');
            unsetToolbar('questionnaire-button');
            questionnaireForm.reset();
            console.log('Questionnaire response saved:', response);
        });
    }

    let participantMenu = document.getElementById('participant-menu');
    if (participantMenu) {
        let loadButton = document.getElementById('participant-load');
        let participantInput = document.getElementById('participant-id');
        if (loadButton && participantInput) {
            loadButton.addEventListener('click', function(ev) {
                let participantId = participantInput.value;
                if (!participantId) {
                    addMsg('error', 'Enter participant ID (1-40)');
                    return;
                }
                loadParticipantTrials(Number(participantId));
                unsetToolbar('participant-button');
            });
        }
    }

    document.body.addEventListener('drop', function(ev) {
        ev.stopPropagation();
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
        function succHook() {
            resetReloadButton();
            window.history.replaceState({}, null, '?');
        }
        function failHook(msg) {addMsg('error', msg);}
        if(ev.dataTransfer.files.length > 0) {
            loadGameFromFiles(ev.dataTransfer.files, null, succHook, failHook);
        }
    });
}

function disableUndoButton() {
    undoButton.classList.add('disabled');
}
function enableUndoButton() {
    undoButton.classList.remove('disabled');
}
function disableRedoButton() {
    redoButton.classList.add('disabled');
}
function enableRedoButton() {
    redoButton.classList.remove('disabled');
}

function closeBtnClickHandler(ev) {
    let closeBtn = ev.target;
    let LiElem = closeBtn.parentElement;
    let msgList = document.getElementById('msg-list');
    msgList.removeChild(LiElem);
}

function addMsg(type, text) {
    let textArray;
    if(Array.isArray(text)) {
        textArray = text;
    }
    else {
        textArray = [text];
    }
    for(const text of textArray) {
        let liElem = document.createElement('li');
        liElem.classList.add(type);
        let msgSpan = document.createElement('span');
        msgSpan.classList.add('msg-text');
        msgSpan.innerHTML = text;
        liElem.appendChild(msgSpan);
        let closeButton = document.createElement('span');
        closeButton.classList.add('close-btn');
        closeButton.addEventListener('click', closeBtnClickHandler);
        liElem.appendChild(closeButton);
        let msgList = document.getElementById('msg-list');
        msgList.appendChild(liElem);
    }
}

function showCelebration() {
    let canvas = document.getElementById('celebrate-canvas');
    if(!canvas.getContext) {return;}
    const width = window.innerWidth, height = window.innerHeight;
    const minDim = Math.min(width, height);
    canvas.width = width;
    canvas.height = height;
    let ctx = canvas.getContext('2d');
    const canvasOffX = Math.floor(width / 2), canvasOffY = Math.floor(height / 3);

    const n = 50;
    let ux = [], uy = [], hues = [];
    for(let i=0; i<n; ++i) {
        ux[i] = 2 * Math.random() - 1;
        uy[i] = 2 * Math.random() - 1;
        hues[i] = 6 * Math.floor(30 * Math.random());
    }

    function terminateAnimation() {
        canvas.width = 0;
        canvas.height = 0;
    }

    let startTime = null;
    function draw(timeStamp) {
        if(startTime === null) {
            startTime = timeStamp;
        }
        const t = (timeStamp - startTime) / 1000;
        const g = 5, vScale = 2;
        ctx.clearRect(0, 0, width, height);
        for(let i=0; i<n; ++i) {
            const x = ux[i]*vScale*t, y = uy[i]*vScale*t + g*t*t / 2;
            const alpha = Math.max(0, 1 - t/2);
            ctx.fillStyle = `hsla(${hues[i]}, 100%, 50%, ${alpha})`;
            ctx.beginPath();
            ctx.arc(canvasOffX + x*minDim, canvasOffY + y*minDim, 8, 0, 2 * Math.PI, true);
            ctx.closePath();
            ctx.fill();
        }
        if(t < 2) {
            window.requestAnimationFrame(draw);
        }
        else {
            terminateAnimation();
        }
    }
    window.requestAnimationFrame(draw);
}

function initThemeFromLocalStorage() {
    try {
        if(window.localStorage.getItem('dark')) {
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            document.documentElement.style.setProperty('color-scheme', 'dark');
        }
    }
    catch(e) {
        console.warn('initializing from localStorage failed: ' + e);
    }
}

function resetReloadButton() {
    let reloadButton = document.getElementById('reload-button');
    if(gameLoadParams !== null) {
        reloadButton.classList.remove('disabled');
    }
    else {
        reloadButton.classList.add('disabled');
    }
}

//== Level navigation code alternative
let menuItems = Array.from(document.querySelectorAll('#ng-hc-list li'));
let currentMenuIndex = -1;
menuItems.forEach((item, index) => {
    item.addEventListener('click', (ev) => {
        currentMenuIndex = index;
        const name = item.getAttribute('data-name');
        modalGroup.classList.add('loading');
        loadGameFromHC(name, null,
            () => succHookWrapper('ng-hc-menu', toQueryString({'srctype':'hc','src':name})),
            toolbarFailHook
        );
        updateCurrentPuzzle(name);
    });
});


document.getElementById('prev-level-button').addEventListener('click', () => {
    if (isParticipantMode()) {
        participantPrevTrial();
        return;
    }
    if (currentMenuIndex > 0) {
        currentMenuIndex = (currentMenuIndex - 1 + menuItems.length) % menuItems.length;
        menuItems[currentMenuIndex].click(); // simulate menu click
    }
});

document.getElementById('next-level-button').addEventListener('click', () => {
    // Download log before moving to next trial/level ONLY if game is not finished
    if (
        typeof game !== 'undefined' && game !== null &&
        game.packingLog && typeof game.packingLog.downloadLog === 'function' &&
        game.won === false
    ) {
        let participant = typeof participantIdSelected !== 'undefined' ? participantIdSelected : 'unknown';
        let trialNum = (typeof participantTrialIndex !== 'undefined' && participantTrialList && participantTrialList[participantTrialIndex]) ? participantTrialList[participantTrialIndex].Trial : 'unknown';
        let filename = `packing-log-participant-${participant}-trial-${trialNum}.json`;
        game.packingLog.downloadLog(filename);
    }
    if (isParticipantMode()) {
        participantNextTrial();
        return;
    }
    if (currentMenuIndex < menuItems.length - 1) {
        currentMenuIndex = (currentMenuIndex + 1) % menuItems.length;
        menuItems[currentMenuIndex].click(); // simulate menu click
    }
});

function updateCurrentPuzzle(nameOrNumber) {
    const label = document.getElementById('current-puzzle-label');
    label.textContent = "Trial " + nameOrNumber;
}
// @license-end