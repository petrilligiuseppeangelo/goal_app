document.addEventListener('DOMContentLoaded', function () {
            // ==============================
            // INIZIALIZZAZIONE
            // ==============================
            initializeApp();

            function initializeApp() {
                setupEventListeners();
                loadFromLocalStorage();
            }

            function setupEventListeners() {
                document.getElementById('export-json-btn').addEventListener('click', exportToJSON);
                document.getElementById('import-json-btn').addEventListener('click', () => {
                    document.getElementById('json-file-input').click();
                });
                document.getElementById('json-file-input').addEventListener('change', importFromJSON);
                document.getElementById('add-goal-btn').addEventListener('click', addNewGoal);

                document.getElementById('goal-input').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        addNewGoal();
                    }
                });
            }

            // ==============================
            // FUNZIONI GOAL
            // ==============================
            function addNewGoal() {
                const goalInput = document.getElementById('goal-input');
                const goalText = goalInput.value.trim();

                if (!goalText) {
                    alert('Inserisci un goal valido');
                    return;
                }

                createGoal(goalText, '1', false, '');
                goalInput.value = '';
                goalInput.focus();
                saveToLocalStorage();
            }

            function createGoal(goalText, priority = '1', isChecked = false, value = '', collapsed = false) {
                const goalList = document.getElementById('goal-list');
                const goalItem = document.createElement('li');
                goalItem.className = `goal-item priority-${priority} ${collapsed ? 'collapsed' : ''} ${isChecked ? 'completed' : ''}`;
                goalItem.setAttribute('data-priority', priority);
                goalItem.setAttribute('data-value', value);
                if (collapsed) {
                    goalItem.setAttribute('data-collapsed', 'true');
                }

                const displayValue = value || '(nessun valore)';
                
                goalItem.innerHTML = `
                    <div class="goal-header">
                        <span class="drag-handle">⋮⋮</span>
                        <span class="collapse-btn ${collapsed ? 'collapsed' : ''}">▼</span>
                        <input type="checkbox" class="goal-checkbox" ${isChecked ? 'checked' : ''}>
                        <span class="goal-text">${goalText}</span>
                        <span class="value-display ${!value ? 'empty-value' : ''}">${displayValue}</span>
                        <input type="range" class="priority-slider" min="1" max="5" value="${priority}" style="margin-left: 15px; width: 100px;">
                        <button class="edit-goal-btn" style="margin-left: 10px;">✍️</button>
                        <button class="set-value-btn" style="margin-left: 5px; background-color: #9C27B0;">📊</button>
                        <button class="delete-goal-btn" style="margin-left: 10px;">×</button>
                    </div>
                    <div class="values-summary">
                        <h4>Valori associati:</h4>
                        <div class="values-list"></div>
                    </div>
                    <div class="milestone-input-container" style="margin-top: 10px;">
                        <input type="text" class="milestone-input" placeholder="Aggiungi una milestone..." style="width: 200px; padding: 5px;">
                        <input type="text" class="milestone-value-input" placeholder="Valore (opzionale)" style="width: 120px; padding: 5px; margin-left: 5px;">
                        <button class="add-milestone-btn">+ Milestone</button>
                    </div>
                    <div class="milestones-container" style="margin-top: 10px;"></div>
                `;

                const goalCheckbox = goalItem.querySelector('.goal-checkbox');
                const goalTextSpan = goalItem.querySelector('.goal-text');
                const valueDisplay = goalItem.querySelector('.value-display');
                const prioritySlider = goalItem.querySelector('.priority-slider');
                const editBtn = goalItem.querySelector('.edit-goal-btn');
                const setValueBtn = goalItem.querySelector('.set-value-btn');
                const deleteBtn = goalItem.querySelector('.delete-goal-btn');
                const dragHandle = goalItem.querySelector('.drag-handle');
                const collapseBtn = goalItem.querySelector('.collapse-btn');
                const milestoneInput = goalItem.querySelector('.milestone-input');
                const milestoneValueInput = goalItem.querySelector('.milestone-value-input');
                const addMilestoneBtn = goalItem.querySelector('.add-milestone-btn');
                const valuesSummary = goalItem.querySelector('.values-summary');

                goalCheckbox.addEventListener('change', () => {
                    if (goalCheckbox.checked) {
                        goalItem.classList.add('completed');
                    } else {
                        goalItem.classList.remove('completed');
                    }
                    saveToLocalStorage();
                });

                prioritySlider.addEventListener('input', (e) => {
                    const newPriority = e.target.value;
                    goalItem.setAttribute('data-priority', newPriority);
                    updateGoalPriorityColor(goalItem, newPriority);
                    reorderGoals();
                    saveToLocalStorage();
                });

                editBtn.addEventListener('click', () => {
                    const currentText = goalTextSpan.textContent;
                    const newText = prompt('Modifica goal:', currentText);
                    if (newText !== null && newText.trim() !== '') {
                        goalTextSpan.textContent = newText.trim();
                        saveToLocalStorage();
                    }
                });

                setValueBtn.addEventListener('click', () => {
                    const currentValue = goalItem.getAttribute('data-value') || '';
                    const newValue = prompt('Imposta valore per il goal (testo qualsiasi):', currentValue);
                    if (newValue !== null) {
                        goalItem.setAttribute('data-value', newValue);
                        if (newValue.trim()) {
                            valueDisplay.textContent = newValue;
                            valueDisplay.classList.remove('empty-value');
                        } else {
                            valueDisplay.textContent = '(nessun valore)';
                            valueDisplay.classList.add('empty-value');
                        }
                        updateGoalValuesSummary(goalItem);
                        saveToLocalStorage();
                    }
                });

                deleteBtn.addEventListener('click', () => {
                    if (confirm('Sei sicuro di voler eliminare questo goal e tutte le sue milestone?')) {
                        goalItem.remove();
                        saveToLocalStorage();
                    }
                });

                // Collapse/expand per goal
                collapseBtn.addEventListener('click', () => {
                    goalItem.classList.toggle('collapsed');
                    collapseBtn.classList.toggle('collapsed');
                    if (goalItem.classList.contains('collapsed')) {
                        goalItem.setAttribute('data-collapsed', 'true');
                        collapseBtn.textContent = '▶';
                    } else {
                        goalItem.removeAttribute('data-collapsed');
                        collapseBtn.textContent = '▼';
                    }
                    saveToLocalStorage();
                });

                setupGoalDrag(dragHandle, goalItem);

                addMilestoneBtn.addEventListener('click', () => {
                    const milestoneValue = milestoneValueInput.value.trim();
                    addMilestoneToGoal(goalItem, milestoneInput.value.trim(), milestoneValue);
                    milestoneInput.value = '';
                    milestoneValueInput.value = '';
                });

                milestoneInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const milestoneValue = milestoneValueInput.value.trim();
                        addMilestoneToGoal(goalItem, milestoneInput.value.trim(), milestoneValue);
                        milestoneInput.value = '';
                        milestoneValueInput.value = '';
                    }
                });

                // Mostra/nascondi riepilogo valori quando si clicca sul valore
                valueDisplay.addEventListener('click', () => {
                    valuesSummary.style.display = valuesSummary.style.display === 'none' ? 'block' : 'none';
                    updateGoalValuesSummary(goalItem);
                });

                insertGoalByPriority(goalList, goalItem, priority);
                updateGoalValuesSummary(goalItem);
                return goalItem;
            }

            // ==============================
            // FUNZIONI MILESTONE
            // ==============================
            function addMilestoneToGoal(goalItem, milestoneText, value = '', level = 0, priority = '1', parentId = null, collapsed = false, isChecked = false) {
                if (!milestoneText) return null;

                const milestonesContainer = goalItem.querySelector('.milestones-container') ||
                    createMilestonesContainer(goalItem);

                const milestoneId = 'milestone_' + Date.now() + Math.random().toString(36).substr(2, 9);
                const milestoneDiv = document.createElement('div');
                milestoneDiv.className = `milestone priority-${priority} ${collapsed ? 'collapsed' : ''} ${isChecked ? 'completed' : ''}`;
                milestoneDiv.setAttribute('data-level', level);
                milestoneDiv.setAttribute('data-priority', priority);
                milestoneDiv.setAttribute('data-id', milestoneId);
                milestoneDiv.setAttribute('data-parent-id', parentId || '');
                milestoneDiv.setAttribute('data-value', value);
                if (collapsed) {
                    milestoneDiv.setAttribute('data-collapsed', 'true');
                }
                milestoneDiv.style.marginLeft = (level * 30) + 'px';
                milestoneDiv.style.position = 'relative';

                const displayValue = value || '(nessun valore)';
                
                // Controlla se questa milestone avrà figli
                const hasChildren = false; // Inizialmente non ha figli

                milestoneDiv.innerHTML = `
                    <span class="milestone-drag-handle">⋮⋮</span>
                    <span class="collapse-btn ${collapsed ? 'collapsed' : ''} ${!hasChildren ? 'no-children' : ''}">${collapsed ? '▶' : '▼'}</span>
                    <input type="checkbox" class="milestone-checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="milestone-text">• ${milestoneText}</span>
                    <span class="milestone-value-display ${!value ? 'empty-value' : ''}">${displayValue}</span>
                    <input type="range" class="milestone-priority-slider" min="1" max="5" value="${priority}" style="margin-left: 10px; width: 80px;">
                    <button class="edit-milestone-btn" style="margin-left: 5px;">✍️</button>
                    <button class="set-milestone-value-btn" style="margin-left: 5px; background-color: #9C27B0;">📊</button>
                    <button class="add-nested-btn" style="margin-left: 5px; background-color: #2196F3;">+ Nested</button>
                    <button class="delete-milestone-btn" style="margin-left: 5px;">×</button>
                    <div class="nested-input-container" style="margin-top: 5px; display: none;">
                        <input type="text" class="nested-milestone-input" placeholder="Aggiungi milestone annidata..." style="width: 180px; padding: 4px; margin-left: ${(level + 1) * 30}px;">
                        <input type="text" class="nested-milestone-value-input" placeholder="Valore (opzionale)" style="width: 100px; padding: 4px; margin-left: 5px;">
                        <button class="confirm-nested-btn" style="margin-left: 5px;">Aggiungi</button>
                    </div>
                `;

                // Troviamo la posizione corretta
                const existingMilestones = Array.from(milestonesContainer.querySelectorAll('.milestone'));
                
                if (parentId) {
                    // Cerchiamo il parent
                    const parentIndex = existingMilestones.findIndex(ms => ms.getAttribute('data-id') === parentId);
                    
                    if (parentIndex !== -1) {
                        // Troviamo tutti i figli di questo parent
                        let insertIndex = parentIndex + 1;
                        let foundSibling = false;
                        
                        for (let i = parentIndex + 1; i < existingMilestones.length; i++) {
                            const currentMs = existingMilestones[i];
                            const currentParentId = currentMs.getAttribute('data-parent-id');
                            const currentLevel = parseInt(currentMs.getAttribute('data-level')) || 0;
                            
                            // Se troviamo un elemento che non è figlio dello stesso parent O ha livello <= al nostro
                            // interrompiamo qui
                            if (currentParentId !== parentId && currentLevel <= level) {
                                break;
                            }
                            
                            // Se troviamo un fratello (stesso parent, stesso livello)
                            if (currentParentId === parentId && currentLevel === level) {
                                // Inseriamo prima del fratello
                                insertIndex = i;
                                foundSibling = true;
                                break;
                            }
                            
                            insertIndex = i + 1;
                        }
                        
                        if (foundSibling) {
                            milestonesContainer.insertBefore(milestoneDiv, existingMilestones[insertIndex]);
                        } else if (insertIndex < existingMilestones.length) {
                            milestonesContainer.insertBefore(milestoneDiv, existingMilestones[insertIndex]);
                        } else {
                            milestonesContainer.appendChild(milestoneDiv);
                        }
                    } else {
                        // Parent non trovato, inseriamo alla fine
                        milestonesContainer.appendChild(milestoneDiv);
                    }
                } else {
                    // Milestone root - troviamo la posizione corretta tra le altre root
                    let insertIndex = existingMilestones.length;
                    
                    for (let i = 0; i < existingMilestones.length; i++) {
                        const currentMs = existingMilestones[i];
                        const currentLevel = parseInt(currentMs.getAttribute('data-level')) || 0;
                        const currentParentId = currentMs.getAttribute('data-parent-id');
                        
                        // Se troviamo una milestone con parent, significa che è figlia di un'altra milestone
                        // Le milestone root vanno inserite prima delle milestone figlie
                        if (!currentParentId && currentLevel > 0) {
                            // Questa non dovrebbe succedere, ma gestiamo il caso
                            insertIndex = i;
                            break;
                        }
                        
                        // Se troviamo una milestone root (stesso livello, nessun parent)
                        if (currentLevel === level && !currentParentId) {
                            // Inseriamo prima di questa milestone root
                            insertIndex = i;
                            break;
                        }
                    }
                    
                    if (insertIndex < existingMilestones.length) {
                        milestonesContainer.insertBefore(milestoneDiv, existingMilestones[insertIndex]);
                    } else {
                        milestonesContainer.appendChild(milestoneDiv);
                    }
                }

                setupMilestoneEventListeners(milestoneDiv, goalItem);
                
                // Se questa milestone ha un genitore, aggiorna il pulsante del genitore
                if (parentId) {
                    updateParentCollapseButton(goalItem, parentId);
                }
                
                updateGoalValuesSummary(goalItem);
                saveToLocalStorage();
                return milestoneDiv;
            }

            function updateParentCollapseButton(goalItem, parentId) {
                const parentMilestone = goalItem.querySelector(`.milestone[data-id="${parentId}"]`);
                if (parentMilestone) {
                    const collapseBtn = parentMilestone.querySelector('.collapse-btn');
                    if (collapseBtn) {
                        collapseBtn.classList.remove('no-children');
                    }
                }
            }

            function setupMilestoneEventListeners(milestoneDiv, goalItem) {
                const milestoneCheckbox = milestoneDiv.querySelector('.milestone-checkbox');
                const milestoneTextSpan = milestoneDiv.querySelector('.milestone-text');
                const milestoneValueDisplay = milestoneDiv.querySelector('.milestone-value-display');
                const prioritySlider = milestoneDiv.querySelector('.milestone-priority-slider');
                const editBtn = milestoneDiv.querySelector('.edit-milestone-btn');
                const setValueBtn = milestoneDiv.querySelector('.set-milestone-value-btn');
                const deleteBtn = milestoneDiv.querySelector('.delete-milestone-btn');
                const addNestedBtn = milestoneDiv.querySelector('.add-nested-btn');
                const nestedInputContainer = milestoneDiv.querySelector('.nested-input-container');
                const nestedInput = milestoneDiv.querySelector('.nested-milestone-input');
                const nestedValueInput = milestoneDiv.querySelector('.nested-milestone-value-input');
                const confirmNestedBtn = milestoneDiv.querySelector('.confirm-nested-btn');
                const dragHandle = milestoneDiv.querySelector('.milestone-drag-handle');
                const collapseBtn = milestoneDiv.querySelector('.collapse-btn');

                const currentLevel = parseInt(milestoneDiv.getAttribute('data-level')) || 0;
                const milestoneId = milestoneDiv.getAttribute('data-id');

                milestoneCheckbox.addEventListener('change', () => {
                    if (milestoneCheckbox.checked) {
                        milestoneDiv.classList.add('completed');
                    } else {
                        milestoneDiv.classList.remove('completed');
                    }
                    saveToLocalStorage();
                });

                prioritySlider.addEventListener('input', (e) => {
                    const newPriority = e.target.value;
                    milestoneDiv.setAttribute('data-priority', newPriority);
                    updateMilestonePriorityColor(milestoneDiv, newPriority);
                    saveToLocalStorage();
                });

                editBtn.addEventListener('click', () => {
                    const currentText = milestoneTextSpan.textContent.replace('• ', '');
                    const newText = prompt('Modifica milestone:', currentText);
                    if (newText !== null && newText.trim() !== '') {
                        milestoneTextSpan.textContent = '• ' + newText.trim();
                        saveToLocalStorage();
                    }
                });

                setValueBtn.addEventListener('click', () => {
                    const currentValue = milestoneDiv.getAttribute('data-value') || '';
                    const newValue = prompt('Imposta valore per la milestone (testo qualsiasi):', currentValue);
                    if (newValue !== null) {
                        milestoneDiv.setAttribute('data-value', newValue);
                        if (newValue.trim()) {
                            milestoneValueDisplay.textContent = newValue;
                            milestoneValueDisplay.classList.remove('empty-value');
                        } else {
                            milestoneValueDisplay.textContent = '(nessun valore)';
                            milestoneValueDisplay.classList.add('empty-value');
                        }
                        updateGoalValuesSummary(goalItem);
                        saveToLocalStorage();
                    }
                });

                deleteBtn.addEventListener('click', () => {
                    if (confirm('Sei sicuro di voler eliminare questa milestone e tutte le sue sotto-milestone?')) {
                        const parentId = milestoneDiv.getAttribute('data-parent-id');
                        // Remove this milestone and all its children
                        const milestonesContainer = goalItem.querySelector('.milestones-container');
                        const allMilestones = Array.from(milestonesContainer.querySelectorAll('.milestone'));
                        const toRemove = [milestoneDiv];
                        
                        // Find all children of this milestone
                        function findChildren(parentId, milestones) {
                            const children = milestones.filter(ms => {
                                const parentIdAttr = ms.getAttribute('data-parent-id');
                                return parentIdAttr === parentId;
                            });
                            
                            children.forEach(child => {
                                toRemove.push(child);
                                findChildren(child.getAttribute('data-id'), milestones);
                            });
                        }
                        
                        findChildren(milestoneId, allMilestones);
                        toRemove.forEach(ms => ms.remove());
                        
                        // Dopo la rimozione, controlla se il genitore ha ancora figli
                        if (parentId) {
                            checkIfParentHasChildren(goalItem, parentId);
                        }
                        
                        updateGoalValuesSummary(goalItem);
                        saveToLocalStorage();
                    }
                });

                addNestedBtn.addEventListener('click', () => {
                    nestedInputContainer.style.display = 'block';
                    nestedInput.focus();
                });

                confirmNestedBtn.addEventListener('click', () => {
                    const nestedText = nestedInput.value.trim();
                    const nestedValue = nestedValueInput.value.trim();
                    if (nestedText) {
                        addMilestoneToGoal(
                            goalItem,
                            nestedText,
                            nestedValue,
                            currentLevel + 1,
                            '1',
                            milestoneId
                        );
                        nestedInput.value = '';
                        nestedValueInput.value = '';
                        nestedInputContainer.style.display = 'none';
                    }
                });

                nestedInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        confirmNestedBtn.click();
                    }
                });

                // Collapse/expand per milestone - SEMPRE funzionante
                collapseBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Controlla se la milestone ha figli
                    const milestonesContainer = goalItem.querySelector('.milestones-container');
                    const allMilestones = Array.from(milestonesContainer.querySelectorAll('.milestone'));
                    const hasChildren = allMilestones.some(ms => ms.getAttribute('data-parent-id') === milestoneId);
                    
                    // Se non ha figli, esci
                    if (!hasChildren) return;
                    
                    // Toggle dello stato collassato
                    const isCollapsed = milestoneDiv.classList.contains('collapsed');
                    
                    if (isCollapsed) {
                        // Espandi
                        milestoneDiv.classList.remove('collapsed');
                        collapseBtn.classList.remove('collapsed');
                        milestoneDiv.removeAttribute('data-collapsed');
                        collapseBtn.textContent = '▼';
                    } else {
                        // Collassa
                        milestoneDiv.classList.add('collapsed');
                        collapseBtn.classList.add('collapsed');
                        milestoneDiv.setAttribute('data-collapsed', 'true');
                        collapseBtn.textContent = '▶';
                    }
                    
                    saveToLocalStorage();
                });

                setupMilestoneDrag(dragHandle, milestoneDiv, goalItem);
            }

            function checkIfParentHasChildren(goalItem, parentId) {
                const parentMilestone = goalItem.querySelector(`.milestone[data-id="${parentId}"]`);
                if (!parentMilestone) return;
                
                const milestonesContainer = goalItem.querySelector('.milestones-container');
                const allMilestones = Array.from(milestonesContainer.querySelectorAll('.milestone'));
                const hasChildren = allMilestones.some(ms => ms.getAttribute('data-parent-id') === parentId);
                
                const collapseBtn = parentMilestone.querySelector('.collapse-btn');
                if (collapseBtn) {
                    if (hasChildren) {
                        collapseBtn.classList.remove('no-children');
                    } else {
                        collapseBtn.classList.add('no-children');
                    }
                }
            }

            // ==============================
            // FUNZIONI UTILITY
            // ==============================
            function createMilestonesContainer(goalItem) {
                const container = document.createElement('div');
                container.className = 'milestones-container';
                container.style.marginTop = '10px';
                goalItem.appendChild(container);
                return container;
            }

            function updateGoalPriorityColor(goalElement, priority) {
                goalElement.classList.remove('priority-1', 'priority-2', 'priority-3', 'priority-4', 'priority-5');
                goalElement.classList.add(`priority-${priority}`);
            }

            function updateMilestonePriorityColor(milestoneElement, priority) {
                milestoneElement.classList.remove('priority-1', 'priority-2', 'priority-3', 'priority-4', 'priority-5');
                milestoneElement.classList.add(`priority-${priority}`);
            }

            function insertGoalByPriority(goalList, goalItem, priority) {
                const goals = Array.from(goalList.children);
                const newPriority = parseInt(priority);

                for (let i = 0; i < goals.length; i++) {
                    const currentGoal = goals[i];
                    const currentPriority = parseInt(currentGoal.getAttribute('data-priority') || '1');

                    if (newPriority > currentPriority) {
                        goalList.insertBefore(goalItem, currentGoal);
                        return;
                    }
                }

                goalList.appendChild(goalItem);
            }

            function reorderGoals() {
                const goalList = document.getElementById('goal-list');
                const goals = Array.from(goalList.children);

                goals.sort((a, b) => {
                    const priorityA = parseInt(a.getAttribute('data-priority') || '1');
                    const priorityB = parseInt(b.getAttribute('data-priority') || '1');
                    return priorityB - priorityA;
                });

                goals.forEach(goal => {
                    goalList.appendChild(goal);
                });
            }

            function updateGoalValuesSummary(goalItem) {
                const goalValue = goalItem.getAttribute('data-value') || '';
                const milestones = goalItem.querySelectorAll('.milestone');
                const valuesListContainer = goalItem.querySelector('.values-summary .values-list');
                
                if (!valuesListContainer) return;
                
                let html = '';
                
                // Aggiungi valore del goal
                html += `<div class="value-item"><strong>Goal:</strong> ${goalValue || '<span class="empty-value">nessun valore</span>'}</div>`;
                
                // Aggiungi valori delle milestone
                if (milestones.length > 0) {
                    milestones.forEach((milestone, index) => {
                        const milestoneText = milestone.querySelector('.milestone-text').textContent.replace('• ', '');
                        const milestoneValue = milestone.getAttribute('data-value') || '';
                        const level = parseInt(milestone.getAttribute('data-level')) || 0;
                        const indent = '&nbsp;'.repeat(level * 4);
                        
                        html += `<div class="value-item">${indent}<strong>Milestone ${index + 1}:</strong> ${milestoneText} - Valore: ${milestoneValue || '<span class="empty-value">nessun valore</span>'}</div>`;
                    });
                } else {
                    html += '<div class="value-item"><em>Nessuna milestone con valori</em></div>';
                }
                
                valuesListContainer.innerHTML = html;
            }

            // ==============================
            // DRAG AND DROP
            // ==============================
            function setupGoalDrag(dragHandle, goalItem) {
                dragHandle.addEventListener('mousedown', startDragGoal);

                function startDragGoal(e) {
                    e.preventDefault();
                    dragSource = goalItem;
                    dragSource.style.opacity = '0.5';

                    document.addEventListener('mousemove', dragGoal);
                    document.addEventListener('mouseup', stopDragGoal);
                }

                function dragGoal(e) {
                    if (!dragSource) return;

                    const goalList = document.getElementById('goal-list');
                    const goals = Array.from(goalList.children);
                    const mouseY = e.clientY;

                    let targetGoal = null;

                    for (const goal of goals) {
                        if (goal === dragSource) continue;

                        const rect = goal.getBoundingClientRect();
                        const goalCenter = rect.top + rect.height / 2;

                        if (mouseY < goalCenter) {
                            targetGoal = goal;
                            break;
                        }
                    }

                    if (targetGoal) {
                        goalList.insertBefore(dragSource, targetGoal);
                    } else {
                        goalList.appendChild(dragSource);
                    }
                }

                function stopDragGoal() {
                    if (dragSource) {
                        dragSource.style.opacity = '1';
                        dragSource = null;
                        saveToLocalStorage();
                    }
                    document.removeEventListener('mousemove', dragGoal);
                    document.removeEventListener('mouseup', stopDragGoal);
                }
            }

            function setupMilestoneDrag(dragHandle, milestoneDiv, goalItem) {
                dragHandle.addEventListener('mousedown', startDragMilestone);

                function startDragMilestone(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    isDraggingMilestone = true;
                    const milestonesContainer = goalItem.querySelector('.milestones-container');
                    const allMilestones = Array.from(milestonesContainer.querySelectorAll('.milestone'));

                    milestoneDiv.style.opacity = '0.5';
                    milestoneDiv.style.zIndex = '1000';

                    document.addEventListener('mousemove', dragMilestone);
                    document.addEventListener('mouseup', stopDragMilestone);

                    function dragMilestone(e) {
                        if (!isDraggingMilestone) return;

                        const mouseY = e.clientY;
                        let closestMilestone = null;
                        let minDistance = Infinity;

                        for (const ms of allMilestones) {
                            if (ms === milestoneDiv) continue;

                            const rect = ms.getBoundingClientRect();
                            const distance = Math.abs(rect.top - mouseY);

                            if (distance < minDistance) {
                                minDistance = distance;
                                closestMilestone = ms;
                            }
                        }

                        if (closestMilestone) {
                            const rect = closestMilestone.getBoundingClientRect();
                            const closestCenter = rect.top + rect.height / 2;

                            if (mouseY < closestCenter) {
                                milestonesContainer.insertBefore(milestoneDiv, closestMilestone);
                            } else {
                                milestonesContainer.insertBefore(milestoneDiv, closestMilestone.nextSibling);
                            }
                        }
                    }

                    function stopDragMilestone() {
                        isDraggingMilestone = false;
                        milestoneDiv.style.opacity = '1';
                        milestoneDiv.style.zIndex = '';
                        saveToLocalStorage();
                        document.removeEventListener('mousemove', dragMilestone);
                        document.removeEventListener('mouseup', stopDragMilestone);
                    }
                }
            }

            // ==============================
            // FUNZIONI SPECIFICHE PER IMPORT/EXPORT
            // ==============================
            function createGoalFromImport(goalText, priority = '1', isChecked = false, value = '', collapsed = false) {
                const goalList = document.getElementById('goal-list');
                const goalItem = document.createElement('li');
                goalItem.className = `goal-item priority-${priority} ${collapsed ? 'collapsed' : ''} ${isChecked ? 'completed' : ''}`;
                goalItem.setAttribute('data-priority', priority);
                goalItem.setAttribute('data-value', value || '');
                if (collapsed) {
                    goalItem.setAttribute('data-collapsed', 'true');
                }

                const displayValue = value || '(nessun valore)';
                
                goalItem.innerHTML = `
                    <div class="goal-header">
                        <span class="drag-handle">⋮⋮</span>
                        <span class="collapse-btn ${collapsed ? 'collapsed' : ''}">${collapsed ? '▶' : '▼'}</span>
                        <input type="checkbox" class="goal-checkbox" ${isChecked ? 'checked' : ''}>
                        <span class="goal-text">${goalText}</span>
                        <span class="value-display ${!value ? 'empty-value' : ''}">${displayValue}</span>
                        <input type="range" class="priority-slider" min="1" max="5" value="${priority}" style="margin-left: 15px; width: 100px;">
                        <button class="edit-goal-btn" style="margin-left: 10px;">✍️</button>
                        <button class="set-value-btn" style="margin-left: 5px; background-color: #9C27B0;">📊</button>
                        <button class="delete-goal-btn" style="margin-left: 10px;">×</button>
                    </div>
                    <div class="values-summary">
                        <h4>Valori associati:</h4>
                        <div class="values-list"></div>
                    </div>
                    <div class="milestone-input-container" style="margin-top: 10px;">
                        <input type="text" class="milestone-input" placeholder="Aggiungi una milestone..." style="width: 200px; padding: 5px;">
                        <input type="text" class="milestone-value-input" placeholder="Valore (opzionale)" style="width: 120px; padding: 5px; margin-left: 5px;">
                        <button class="add-milestone-btn">+ Milestone</button>
                    </div>
                    <div class="milestones-container" style="margin-top: 10px;"></div>
                `;

                const goalCheckbox = goalItem.querySelector('.goal-checkbox');
                const goalTextSpan = goalItem.querySelector('.goal-text');
                const valueDisplay = goalItem.querySelector('.value-display');
                const prioritySlider = goalItem.querySelector('.priority-slider');
                const editBtn = goalItem.querySelector('.edit-goal-btn');
                const setValueBtn = goalItem.querySelector('.set-value-btn');
                const deleteBtn = goalItem.querySelector('.delete-goal-btn');
                const dragHandle = goalItem.querySelector('.drag-handle');
                const collapseBtn = goalItem.querySelector('.collapse-btn');
                const milestoneInput = goalItem.querySelector('.milestone-input');
                const milestoneValueInput = goalItem.querySelector('.milestone-value-input');
                const addMilestoneBtn = goalItem.querySelector('.add-milestone-btn');
                const valuesSummary = goalItem.querySelector('.values-summary');

                goalCheckbox.addEventListener('change', () => {
                    if (goalCheckbox.checked) {
                        goalItem.classList.add('completed');
                    } else {
                        goalItem.classList.remove('completed');
                    }
                    saveToLocalStorage();
                });

                prioritySlider.addEventListener('input', (e) => {
                    const newPriority = e.target.value;
                    goalItem.setAttribute('data-priority', newPriority);
                    updateGoalPriorityColor(goalItem, newPriority);
                    reorderGoals();
                    saveToLocalStorage();
                });

                editBtn.addEventListener('click', () => {
                    const currentText = goalTextSpan.textContent;
                    const newText = prompt('Modifica goal:', currentText);
                    if (newText !== null && newText.trim() !== '') {
                        goalTextSpan.textContent = newText.trim();
                        saveToLocalStorage();
                    }
                });

                setValueBtn.addEventListener('click', () => {
                    const currentValue = goalItem.getAttribute('data-value') || '';
                    const newValue = prompt('Imposta valore per il goal (testo qualsiasi):', currentValue);
                    if (newValue !== null) {
                        goalItem.setAttribute('data-value', newValue);
                        if (newValue.trim()) {
                            valueDisplay.textContent = newValue;
                            valueDisplay.classList.remove('empty-value');
                        } else {
                            valueDisplay.textContent = '(nessun valore)';
                            valueDisplay.classList.add('empty-value');
                        }
                        updateGoalValuesSummary(goalItem);
                        saveToLocalStorage();
                    }
                });

                deleteBtn.addEventListener('click', () => {
                    if (confirm('Sei sicuro di voler eliminare questo goal e tutte le sue milestone?')) {
                        goalItem.remove();
                        saveToLocalStorage();
                    }
                });

                // Collapse/expand per goal
                collapseBtn.addEventListener('click', () => {
                    goalItem.classList.toggle('collapsed');
                    collapseBtn.classList.toggle('collapsed');
                    if (goalItem.classList.contains('collapsed')) {
                        goalItem.setAttribute('data-collapsed', 'true');
                        collapseBtn.textContent = '▶';
                    } else {
                        goalItem.removeAttribute('data-collapsed');
                        collapseBtn.textContent = '▼';
                    }
                    saveToLocalStorage();
                });

                setupGoalDrag(dragHandle, goalItem);

                addMilestoneBtn.addEventListener('click', () => {
                    const milestoneValue = milestoneValueInput.value.trim();
                    addMilestoneToGoal(goalItem, milestoneInput.value.trim(), milestoneValue);
                    milestoneInput.value = '';
                    milestoneValueInput.value = '';
                });

                milestoneInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const milestoneValue = milestoneValueInput.value.trim();
                        addMilestoneToGoal(goalItem, milestoneInput.value.trim(), milestoneValue);
                        milestoneInput.value = '';
                        milestoneValueInput.value = '';
                    }
                });

                // Mostra/nascondi riepilogo valori quando si clicca sul valore
                valueDisplay.addEventListener('click', () => {
                    valuesSummary.style.display = valuesSummary.style.display === 'none' ? 'block' : 'none';
                    updateGoalValuesSummary(goalItem);
                });

                goalList.appendChild(goalItem);
                return goalItem;
            }

            function createMilestoneFromImport(goalItem, milestoneText, level = 0, priority = '1', value = '', milestoneId = null, parentId = null, collapsed = false, isChecked = false) {
                if (!milestoneText) return null;

                const milestonesContainer = goalItem.querySelector('.milestones-container') ||
                    createMilestonesContainer(goalItem);

                const finalMilestoneId = milestoneId || 'milestone_' + Date.now() + Math.random().toString(36).substr(2, 9);
                const milestoneDiv = document.createElement('div');
                milestoneDiv.className = `milestone priority-${priority} ${collapsed ? 'collapsed' : ''} ${isChecked ? 'completed' : ''}`;
                milestoneDiv.setAttribute('data-level', level);
                milestoneDiv.setAttribute('data-priority', priority);
                milestoneDiv.setAttribute('data-id', finalMilestoneId);
                milestoneDiv.setAttribute('data-parent-id', parentId || '');
                milestoneDiv.setAttribute('data-value', value || '');
                if (collapsed) {
                    milestoneDiv.setAttribute('data-collapsed', 'true');
                }
                milestoneDiv.style.marginLeft = (level * 30) + 'px';
                milestoneDiv.style.position = 'relative';

                const displayValue = value || '(nessun valore)';
                
                // Controlla se questa milestone avrà figli (non lo sappiamo ancora, lo controlleremo dopo)
                const hasChildren = false;

                milestoneDiv.innerHTML = `
                    <span class="milestone-drag-handle">⋮⋮</span>
                    <span class="collapse-btn ${collapsed ? 'collapsed' : ''} ${!hasChildren ? 'no-children' : ''}">${collapsed ? '▶' : '▼'}</span>
                    <input type="checkbox" class="milestone-checkbox" ${isChecked ? 'checked' : ''}>
                    <span class="milestone-text">• ${milestoneText}</span>
                    <span class="milestone-value-display ${!value ? 'empty-value' : ''}">${displayValue}</span>
                    <input type="range" class="milestone-priority-slider" min="1" max="5" value="${priority}" style="margin-left: 10px; width: 80px;">
                    <button class="edit-milestone-btn" style="margin-left: 5px;">✍️</button>
                    <button class="set-milestone-value-btn" style="margin-left: 5px; background-color: #9C27B0;">📊</button>
                    <button class="add-nested-btn" style="margin-left: 5px; background-color: #2196F3;">+ Nested</button>
                    <button class="delete-milestone-btn" style="margin-left: 5px;">×</button>
                    <div class="nested-input-container" style="margin-top: 5px; display: none;">
                        <input type="text" class="nested-milestone-input" placeholder="Aggiungi milestone annidata..." style="width: 180px; padding: 4px; margin-left: ${(level + 1) * 30}px;">
                        <input type="text" class="nested-milestone-value-input" placeholder="Valore (opzionale)" style="width: 100px; padding: 4px; margin-left: 5px;">
                        <button class="confirm-nested-btn" style="margin-left: 5px;">Aggiungi</button>
                    </div>
                `;

                // Per l'importazione, usiamo un approccio più semplice:
                // Semplicemente aggiungiamo alla fine, perché l'ordine sarà già corretto
                // grazie alla ricorsione pre-order
                milestonesContainer.appendChild(milestoneDiv);

                setupMilestoneEventListeners(milestoneDiv, goalItem);
                return milestoneDiv;
            }

            // Funzione per aggiornare tutti i pulsanti di collasso dopo l'importazione
            function updateAllCollapseButtons(goalItem) {
                const milestones = goalItem.querySelectorAll('.milestone');
                milestones.forEach(milestone => {
                    const milestoneId = milestone.getAttribute('data-id');
                    const milestonesContainer = goalItem.querySelector('.milestones-container');
                    const allMilestones = Array.from(milestonesContainer.querySelectorAll('.milestone'));
                    const hasChildren = allMilestones.some(ms => ms.getAttribute('data-parent-id') === milestoneId);
                    
                    const collapseBtn = milestone.querySelector('.collapse-btn');
                    if (collapseBtn) {
                        if (hasChildren) {
                            collapseBtn.classList.remove('no-children');
                        } else {
                            collapseBtn.classList.add('no-children');
                        }
                    }
                });
            }

            // ==============================
            // ESPORTAZIONE/IMPORTAZIONE JSON CON VALORI TESTUALI
            // ==============================
            function collectAllData() {
                const goalsData = [];
                const goalItems = document.querySelectorAll('.goal-item');

                goalItems.forEach(goalItem => {
                    const goalData = {
                        name: goalItem.querySelector('.goal-text').textContent,
                        priority: goalItem.getAttribute('data-priority') || '1',
                        checked: goalItem.querySelector('.goal-checkbox').checked,
                        value: goalItem.getAttribute('data-value') || '',
                        collapsed: goalItem.hasAttribute('data-collapsed'),
                        milestones: []
                    };

                    // Build milestone hierarchy
                    const milestones = goalItem.querySelectorAll('.milestone');
                    const milestoneMap = new Map();
                    const rootMilestones = [];

                    // First pass: create objects for all milestones
                    milestones.forEach(milestone => {
                        const text = milestone.querySelector('.milestone-text').textContent.replace('• ', '');
                        const level = parseInt(milestone.getAttribute('data-level')) || 0;
                        const priority = milestone.getAttribute('data-priority') || '1';
                        const value = milestone.getAttribute('data-value') || '';
                        const id = milestone.getAttribute('data-id');
                        const parentId = milestone.getAttribute('data-parent-id') || null;
                        const collapsed = milestone.hasAttribute('data-collapsed');
                        const checked = milestone.querySelector('.milestone-checkbox').checked;

                        const milestoneObj = {
                            id: id,
                            text: text,
                            level: level,
                            priority: priority,
                            value: value,
                            parentId: parentId,
                            collapsed: collapsed,
                            checked: checked,
                            children: []
                        };

                        milestoneMap.set(id, milestoneObj);
                    });

                    // Second pass: build hierarchy
                    milestoneMap.forEach(milestoneObj => {
                        if (!milestoneObj.parentId || !milestoneMap.has(milestoneObj.parentId)) {
                            rootMilestones.push(milestoneObj);
                        } else {
                            const parent = milestoneMap.get(milestoneObj.parentId);
                            if (parent) {
                                parent.children.push(milestoneObj);
                            } else {
                                // If parent not found, treat as root
                                rootMilestones.push(milestoneObj);
                            }
                        }
                    });

                    // Function to convert hierarchy to nested structure
                    function buildNestedStructure(nodes) {
                        return nodes.map(node => {
                            const result = {
                                id: node.id,
                                text: node.text,
                                level: node.level,
                                priority: node.priority,
                                value: node.value || '',
                                collapsed: node.collapsed || false,
                                checked: node.checked || false,
                                children: []
                            };
                            
                            // Find direct children
                            const children = Array.from(milestoneMap.values()).filter(
                                ms => ms.parentId === node.id
                            );
                            
                            if (children.length > 0) {
                                result.children = buildNestedStructure(children);
                            }
                            
                            return result;
                        });
                    }

                    goalData.milestones = buildNestedStructure(rootMilestones);
                    goalsData.push(goalData);
                });

                return {
                    version: "9.0",
                    exportDate: new Date().toISOString(),
                    totalGoals: goalsData.length,
                    goals: goalsData
                };
            }

            function exportToJSON() {
                const data = collectAllData();
                const jsonString = JSON.stringify(data, null, 2);

                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `goals_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                URL.revokeObjectURL(url);
                alert('Dati esportati con successo!');
            }

            function importFromJSON(event) {
                const file = event.target.files[0];
                if (!file) return;

                const reader = new FileReader();

                reader.onload = function (e) {
                    try {
                        const importedData = JSON.parse(e.target.result);

                        if (!importedData.goals || !Array.isArray(importedData.goals)) {
                            throw new Error('Formato JSON non valido');
                        }

                        // Clear existing goals
                        document.getElementById('goal-list').innerHTML = '';

                        importedData.goals.forEach(goalData => {
                            const goalItem = createGoalFromImport(
                                goalData.name, 
                                goalData.priority, 
                                goalData.checked,
                                goalData.value || '',
                                goalData.collapsed || false
                            );

                            if (goalData.milestones && goalData.milestones.length > 0) {
                                // Function to recursively add milestones with hierarchy
                                function addMilestoneHierarchy(nodes, parentId = null) {
                                    nodes.forEach(node => {
                                        const milestoneDiv = createMilestoneFromImport(
                                            goalItem,
                                            node.text,
                                            node.level,
                                            node.priority,
                                            node.value || '',
                                            node.id,
                                            parentId,
                                            node.collapsed || false,
                                            node.checked || false
                                        );
                                        
                                        // Recursively add children
                                        if (node.children && node.children.length > 0) {
                                            addMilestoneHierarchy(node.children, node.id);
                                        }
                                    });
                                }
                                
                                addMilestoneHierarchy(goalData.milestones);
                            }
                            
                            // Dopo aver creato tutte le milestone, aggiorna i pulsanti di collasso
                            updateAllCollapseButtons(goalItem);
                            updateGoalValuesSummary(goalItem);
                        });

                        alert(`Importati ${importedData.goals.length} goal con successo!`);
                        saveToLocalStorage();

                    } catch (error) {
                        console.error('Errore durante l\'importazione:', error);
                        alert('Errore durante l\'importazione. Verifica il formato del file.');
                    }
                };

                reader.readAsText(file);
                event.target.value = '';
            }

            // ==============================
            // LOCAL STORAGE
            // ==============================
            function saveToLocalStorage() {
                const data = collectAllData();
                localStorage.setItem('goalAppData', JSON.stringify(data));
            }

            function loadFromLocalStorage() {
                const savedData = localStorage.getItem('goalAppData');
                if (!savedData) return;

                try {
                    const data = JSON.parse(savedData);

                    if (data.goals && Array.isArray(data.goals)) {
                        data.goals.forEach(goalData => {
                            const goalItem = createGoalFromImport(
                                goalData.name, 
                                goalData.priority, 
                                goalData.checked,
                                goalData.value || '',
                                goalData.collapsed || false
                            );

                            if (goalData.milestones && goalData.milestones.length > 0) {
                                // Function to recursively add milestones with hierarchy
                                function addMilestoneHierarchy(nodes, parentId = null) {
                                    nodes.forEach(node => {
                                        const milestoneDiv = createMilestoneFromImport(
                                            goalItem,
                                            node.text,
                                            node.level,
                                            node.priority,
                                            node.value || '',
                                            node.id,
                                            parentId,
                                            node.collapsed || false,
                                            node.checked || false
                                        );
                                        
                                        // Recursively add children
                                        if (node.children && node.children.length > 0) {
                                            addMilestoneHierarchy(node.children, node.id);
                                        }
                                    });
                                }
                                
                                addMilestoneHierarchy(goalData.milestones);
                            }
                            
                            // Dopo aver creato tutte le milestone, aggiorna i pulsanti di collasso
                            updateAllCollapseButtons(goalItem);
                            updateGoalValuesSummary(goalItem);
                        });
                    }
                } catch (error) {
                    console.error('Errore nel caricamento da localStorage:', error);
                    localStorage.removeItem('goalAppData');
                }
            }
        });