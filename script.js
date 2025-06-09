// script.js - Core application logic for the Smart Data Combiner.
// All variables, functions, and comments are in English.

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const listInputsContainer = document.getElementById('listInputsContainer');
    const addListButton = document.getElementById('addListButton');
    const generateButton = document.getElementById('generateButton');
    const resultsTextarea = document.getElementById('resultsTextarea');
    const totalCombinationsDisplay = document.getElementById('totalCombinationsDisplay');
    const copyResultsButton = document.getElementById('copyResultsButton');
    const downloadCsvButton = document.getElementById('downloadCsvButton');
    const customSeparatorInput = document.getElementById('customSeparatorInput');
    const prefixInput = document.getElementById('prefixInput');
    const suffixInput = document.getElementById('suffixInput');
    const liveCombinationCountDisplay = document.getElementById('liveCombinationCountDisplay'); 
    const livePreviewContainer = document.getElementById('livePreviewContainer');


    // --- State Variables ---
    let listCounter = 0; 

    // --- Constants ---
    const FREE_TIER_LIST_LIMIT = 3;
    const FREE_TIER_ITEM_LIMIT_PER_LIST = 3; 
    const FREE_TIER_COMBINATION_LIMIT = 18; 

    // --- Helper for Internationalization (i18n) ---
    // getText is expected to be globally available from ui.js
    const _ = window.getText; 

    // --- Core Functions ---

    function updateCustomSeparatorState() {
        const selectedSeparatorType = document.querySelector('input[name="separatorType"]:checked').value;
        customSeparatorInput.disabled = selectedSeparatorType !== 'custom';
        if (selectedSeparatorType !== 'custom') {
            customSeparatorInput.value = ''; 
        }
    }

    function calculateAndDisplayLiveCombinationCount() {
        if (!liveCombinationCountDisplay || !listInputsContainer) return; // Ensure elements exist

        const listGroups = listInputsContainer.getElementsByClassName('list-input-group');
        
        if (listGroups.length === 0) {
            liveCombinationCountDisplay.textContent = '0';
            livePreviewContainer.style.display = 'none'; // Hide if no lists
            return;
        }
        livePreviewContainer.style.display = 'block'; // Show if there are lists


        let potentialLists = [];
        // Consider only lists up to the free tier limit for the live preview of combinations.
        const listsToConsiderForPreview = Math.min(listGroups.length, FREE_TIER_LIST_LIMIT);

        for (let i = 0; i < listsToConsiderForPreview; i++) { 
            const textarea = listGroups[i].querySelector('.list-items-textarea');
            if (textarea) {
                const items = textarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');
                // For live preview, we show potential even if items exceed per-list limit temporarily.
                // The actual generation will still respect FREE_TIER_ITEM_LIMIT_PER_LIST.
                if (items.length > 0) {
                    potentialLists.push(items);
                }
            }
        }
        
        if (potentialLists.length === 0) { // If all considered lists are empty
            liveCombinationCountDisplay.textContent = '0';
            return;
        }

        const generationType = document.querySelector('input[name="generationType"]:checked').value;
        let count = 0;

        if (generationType === 'combinations') {
            if (potentialLists.some(list => list.length === 0)) { 
                count = 0;
            } else {
                count = potentialLists.reduce((acc, list) => acc * list.length, 1);
            }
        } else { 
            if (potentialLists.length === 1) {
                const n = potentialLists[0].length;
                if (n > 0) { 
                    count = 1;
                    for (let i = 2; i <= n; i++) { // Factorial: n!
                         if (count > 10000000 && i < n) { // Prevent excessively large factorial calculations for preview
                            count = Infinity; // Or a very large number string like "1M+"
                            break;
                        }
                        count *= i;
                    }
                } else {
                    count = 0;
                }
            } else { 
                 if (potentialLists.some(list => list.length === 0)) {
                    count = 0;
                } else {
                    count = potentialLists.reduce((acc, list) => acc * list.length, 1);
                }
            }
        }
        liveCombinationCountDisplay.textContent = count === Infinity ? "10,000,000+" : count.toLocaleString(); 
    }


    function validateAllInputsAndToggleButtonState() {
        let isAnyLimitExceeded = false;
        const listGroups = listInputsContainer.getElementsByClassName('list-input-group');

        if (listGroups.length > FREE_TIER_LIST_LIMIT) {
            isAnyLimitExceeded = true; 
        }
        if (listGroups.length === 0) {
            isAnyLimitExceeded = true; 
        }

        for (let i = 0; i < listGroups.length; i++) {
            const textarea = listGroups[i].querySelector('.list-items-textarea');
            if (textarea) {
                const lines = textarea.value.split('\n');
                if (lines.length > FREE_TIER_ITEM_LIMIT_PER_LIST) {
                    textarea.style.borderColor = 'var(--error-red)';
                    isAnyLimitExceeded = true;
                } else {
                    textarea.style.borderColor = 'var(--border-dark)';
                }
            }
        }
        if (generateButton) { // Ensure generateButton exists
            generateButton.disabled = isAnyLimitExceeded;
        }
        calculateAndDisplayLiveCombinationCount(); 
        return !isAnyLimitExceeded; 
    }


    function addListInput() {
        const currentListCount = listInputsContainer.getElementsByClassName('list-input-group').length;
        if (currentListCount >= FREE_TIER_LIST_LIMIT) {
            alert(_('alertListLimitReached', { listLimit: FREE_TIER_LIST_LIMIT }));
            return;
        }
        listCounter++;
        const listGroup = document.createElement('div');
        listGroup.className = 'list-input-group';
        listGroup.dataset.listId = listCounter; 
        
        // Use getText directly here to ensure it has the latest language context
        const listLabelText = _('listLabel');
        const listTitlePlaceholderText = _('listTitlePlaceholder');
        const listItemsPlaceholderText = _('listItemsPlaceholder', { itemLimit: FREE_TIER_ITEM_LIMIT_PER_LIST });
        const removeListButtonText = _('removeListButton');

        listGroup.innerHTML = `
            <label>${listLabelText} ${currentListCount + 1}:</label>
            <input type="text" class="list-title-input" placeholder="${listTitlePlaceholderText}">
            <textarea class="list-items-textarea" placeholder="${listItemsPlaceholderText}"></textarea>
            <div class="list-actions-container">
                <button class="remove-list-button">${removeListButtonText}</button>
            </div>
        `;
        listInputsContainer.appendChild(listGroup);
        const removeButton = listGroup.querySelector('.remove-list-button');
        removeButton.addEventListener('click', () => removeListInput(listGroup));
        
        const itemsTextarea = listGroup.querySelector('.list-items-textarea');
        itemsTextarea.addEventListener('input', function() {
            let lines = this.value.split('\n');
            if (lines.length > FREE_TIER_ITEM_LIMIT_PER_LIST) {
                alert(_('alertItemInputLimitReached', { itemLimit: FREE_TIER_ITEM_LIMIT_PER_LIST }));
                const keptLines = lines.slice(0, FREE_TIER_ITEM_LIMIT_PER_LIST);
                this.value = keptLines.join('\n');
            }
            validateAllInputsAndToggleButtonState(); 
        });

        if (listInputsContainer.getElementsByClassName('list-input-group').length >= FREE_TIER_LIST_LIMIT) {
            addListButton.disabled = true;
        }
        validateAllInputsAndToggleButtonState(); 
    }
    
    function removeListInput(listGroupElement) {
        if (listGroupElement) {
            listInputsContainer.removeChild(listGroupElement);
            if (listInputsContainer.getElementsByClassName('list-input-group').length < FREE_TIER_LIST_LIMIT) {
                addListButton.disabled = false;
            }
            updateListLabels();
            validateAllInputsAndToggleButtonState(); 
        }
    }

    function updateListLabels() {
        const listGroups = listInputsContainer.getElementsByClassName('list-input-group');
        const listLabelText = _('listLabel'); // Get translated "List"
        for (let i = 0; i < listGroups.length; i++) {
            const labelElement = listGroups[i].querySelector('label');
            if (labelElement) {
                labelElement.textContent = `${listLabelText} ${i + 1}:`;
            }
        }
    }
        
    function cartesianProduct(arrays) {
        if (!arrays || arrays.length === 0) return [[]];
        const validArrays = arrays.filter(arr => arr.length > 0);
        if (validArrays.length === 0) return [[]]; 
        return validArrays.reduce((accumulator, currentValue) => {
            return accumulator.flatMap(accItem => {
                return currentValue.map(currItem => {
                    const accArray = Array.isArray(accItem) ? accItem : [accItem];
                    return [...accArray, currItem];
                });
            });
        }, [[]]);
    }

    function generatePermutationsSingleList(array) {
        const result = [];
        function permute(currentPermutation, remainingElements) {
            if (remainingElements.length === 0) {
                result.push(currentPermutation.join('')); 
                return;
            }
            for (let i = 0; i < remainingElements.length; i++) {
                // Prevent excessively long permutations during actual generation if needed
                if (result.length >= FREE_TIER_COMBINATION_LIMIT * 2 && FREE_TIER_COMBINATION_LIMIT > 0) break; // Heuristic limit

                const nextElement = remainingElements[i];
                const nextPermutation = currentPermutation.concat(nextElement);
                const nextRemaining = remainingElements.slice(0, i).concat(remainingElements.slice(i + 1));
                permute(nextPermutation, nextRemaining);
            }
        }
        permute([], array);
        return result;
    }

    function generateCombinationsOrPermutations() {
        if (!validateAllInputsAndToggleButtonState()) {
            const listGroups = listInputsContainer.getElementsByClassName('list-input-group');
            for (let i = 0; i < listGroups.length; i++) {
                const textarea = listGroups[i].querySelector('.list-items-textarea');
                const lines = textarea.value.split('\n'); 
                if (lines.length > FREE_TIER_ITEM_LIMIT_PER_LIST) {
                    alert(_('alertItemsExceedLimitInList', { listNumber: i + 1, itemLimit: FREE_TIER_ITEM_LIMIT_PER_LIST }));
                    return; 
                }
            }
            if (listGroups.length === 0) {
                 alert(_('alertNoLists'));
                 return;
            }
            return; 
        }

        const allInputLists = [];
        let freeTierLimitAlerts = {
            combinationCountExceeded: false
        };

        document.querySelectorAll('.list-input-group .list-items-textarea').forEach(textarea => {
            let items = textarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');
            if (items.length > FREE_TIER_ITEM_LIMIT_PER_LIST) {
                items = items.slice(0, FREE_TIER_ITEM_LIMIT_PER_LIST); 
            }
            if (items.length > 0) {
                allInputLists.push(items);
            }
        });

        if (allInputLists.length === 0) {
            alert(_('alertNoLists'));
            return;
        }
        
        let processedLists = allInputLists;
        if (allInputLists.length > FREE_TIER_LIST_LIMIT) { 
             processedLists = allInputLists.slice(0, FREE_TIER_LIST_LIMIT);
        }

        const generationType = document.querySelector('input[name="generationType"]:checked').value;
        let separatorChoice = document.querySelector('input[name="separatorType"]:checked').value;
        let actualSeparator;
        if (separatorChoice === 'custom') actualSeparator = customSeparatorInput.value;
        else if (separatorChoice === 'space') actualSeparator = ' ';
        else if (separatorChoice === 'comma') actualSeparator = ',';
        else if (separatorChoice === 'hyphen') actualSeparator = '-';
        else actualSeparator = ' ';

        const prefix = prefixInput.value;
        const suffix = suffixInput.value;
        let generatedResults = [];

        if (generationType === 'combinations') {
            let rawCombinations = cartesianProduct(processedLists);
            if (rawCombinations.length === 1 && rawCombinations[0].length === 0) {
                 generatedResults = []; 
            } else {
                generatedResults = rawCombinations.map(combo => {
                    const itemsToJoin = Array.isArray(combo) ? combo : [combo]; 
                    return prefix + itemsToJoin.join(actualSeparator) + suffix;
                });
            }
        } else { 
            if (processedLists.length === 1) {
                generatedResults = generatePermutationsSingleList(processedLists[0]).map(p => prefix + p + suffix);
            } else {
                alert(_('alertPermutationsMultipleLists'));
                let rawPermutationsAsCombinations = cartesianProduct(processedLists);
                 if (rawPermutationsAsCombinations.length === 1 && rawPermutationsAsCombinations[0].length === 0) {
                    generatedResults = [];
                } else {
                    generatedResults = rawPermutationsAsCombinations.map(combo => {
                        const itemsToJoin = Array.isArray(combo) ? combo : [combo];
                        return prefix + itemsToJoin.join(actualSeparator) + suffix;
                    });
                }
            }
        }
        
        if (generatedResults.length > FREE_TIER_COMBINATION_LIMIT) {
            freeTierLimitAlerts.combinationCountExceeded = true;
            resultsTextarea.value = generatedResults.slice(0, FREE_TIER_COMBINATION_LIMIT).join('\n');
            totalCombinationsDisplay.textContent = `${FREE_TIER_COMBINATION_LIMIT}${_('totalCombinationsFreeLimitSuffix')}`;
        } else {
            resultsTextarea.value = generatedResults.join('\n');
            totalCombinationsDisplay.textContent = generatedResults.length;
        }

        let alertMessageParts = [];
        if (freeTierLimitAlerts.combinationCountExceeded) {
            alertMessageParts.push(_('alertCombinationLimitWarning', { combinationLimit: FREE_TIER_COMBINATION_LIMIT }));
        }
        if (alertMessageParts.length > 0) {
            alert(`${_('alertFreeLimitsReachedTitle')}\n\n${alertMessageParts.join('\n')}`);
        }
    }

    // --- Event Listeners Setup ---
    addListButton.addEventListener('click', addListInput);
    if (generateButton) { // Check if generateButton exists before adding listener
        generateButton.addEventListener('click', generateCombinationsOrPermutations);
    }
    
    copyResultsButton.addEventListener('click', () => {
        if (!resultsTextarea.value) return; 
        resultsTextarea.select();
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(resultsTextarea.value)
                    .then(() => alert(_('alertResultsCopied')))
                    .catch(err => {
                         console.warn('Async copy failed, trying execCommand: ', err);
                         document.execCommand('copy'); 
                         alert(_('alertResultsCopied'));
                    });
            } else {
                document.execCommand('copy'); 
                alert(_('alertResultsCopied'));
            }
        } catch (err) {
            console.error('Failed to copy results: ', err);
        }
        if (window.getSelection) window.getSelection().removeAllRanges();
        else if (document.selection) document.selection.empty();
    });

    downloadCsvButton.addEventListener('click', () => alert(_('alertPremiumFeature')));
    
    document.querySelectorAll('input[name="separatorType"]').forEach(radio => {
        radio.addEventListener('change', updateCustomSeparatorState);
    });
    document.querySelectorAll('input[name="generationType"]').forEach(radio => {
        radio.addEventListener('change', calculateAndDisplayLiveCombinationCount);
    });


    // --- Initialization ---
    updateCustomSeparatorState(); 
    addListInput(); 
    validateAllInputsAndToggleButtonState(); 

    // This function is called by ui.js when language changes
    window.translateDynamicElements = function(languageCode) { 
        updateListLabels(); 
        const listGroups = listInputsContainer.getElementsByClassName('list-input-group');
        // It's important that _ (window.getText) is called *after* ui.js has updated its internal language
        // So, these calls to _() should get the newly selected language's texts.
        const listItemsPlaceholderText = _('listItemsPlaceholder', { itemLimit: FREE_TIER_ITEM_LIMIT_PER_LIST });
        const removeListButtonText = _('removeListButton');
        const listTitlePlaceholderText = _('listTitlePlaceholder');

        for (let i = 0; i < listGroups.length; i++) {
            const group = listGroups[i];
            const titleInput = group.querySelector('.list-title-input');
            const itemsTextarea = group.querySelector('.list-items-textarea');
            const removeButton = group.querySelector('.remove-list-button');
            if (titleInput) titleInput.placeholder = listTitlePlaceholderText;
            if (itemsTextarea) itemsTextarea.placeholder = listItemsPlaceholderText;
            if (removeButton) removeButton.textContent = removeListButtonText;
        }
        // Also re-translate the live preview label
        const livePreviewLabelElement = document.querySelector('.live-preview-info [data-lang-key="livePreviewLabel"]');
        if (livePreviewLabelElement) {
            livePreviewLabelElement.textContent = _('livePreviewLabel');
        }

        validateAllInputsAndToggleButtonState(); 
    };
});