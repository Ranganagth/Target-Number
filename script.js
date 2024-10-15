let level = 1;
let targetNumber;
let givenNumbers;
let usedNumbers = [];
let calculation = "";
let inputTokens = [];

const operations = ['+', '-', '*', '/'];

const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const levelNumberDisplay = document.getElementById('level-number');
const finalLevelDisplay = document.getElementById('final-level');
const calculationDisplay = document.getElementById('calculation-display');
const feedbackDisplay = document.getElementById('feedback');
const submitButton = document.getElementById('submit-button');
const numberPad = document.getElementById('number-pad');

const startGameButton = document.getElementById('start-game-button');
const nextLevelButton = document.getElementById('next-level-button');

function initGame() {
    showScreen('title-screen');

    startGameButton.addEventListener('click', () => {
        level = 1;
        startLevel();
    });

    nextLevelButton.addEventListener('click', () => {
        level++;
        startLevel();
    });
}

function startLevel() {
    usedNumbers = [];
    calculation = "";
    inputTokens = [];
    feedbackDisplay.textContent = "";
    calculationDisplay.textContent = "Select numbers and operators below";

    levelNumberDisplay.textContent = level;

    generateLevel();

    setupNumberPad();

    showScreen('game-screen');
}

function generateLevel() {
    let isValidPuzzle = false;

    while (!isValidPuzzle) {
        let numberCount;
        let maxNumber;
        let maxTarget;

        if (level <= 10) {
            numberCount = 3;
            maxNumber = 10;
            maxTarget = 10;
        } else if (level <= 20) {
            numberCount = 4;
            maxNumber = 20;
            maxTarget = 50;
        } else if (level <= 30) {
            numberCount = 5;
            maxNumber = 50;
            maxTarget = 100;
        } else {
            numberCount = 6;
            maxNumber = 100 + level * 2;
            maxTarget = null;
        }

        givenNumbers = [];
        for (let i = 0; i < numberCount; i++) {
            givenNumbers.push(getRandomInt(1, maxNumber));
        }

        const expressionResult = generateValidExpression(givenNumbers.slice(), maxTarget, level <= 30);

        if (expressionResult) {
            targetNumber = expressionResult.result;
            isValidPuzzle = true;

            document.getElementById('target-number').textContent = targetNumber;
        }
    }
}

function generateValidExpression(numbers, maxTarget, positiveOnly) {
    shuffleArray(numbers);

    for (let attempt = 0; attempt < 100; attempt++) {
        let expression = "";
        let usedNums = [];

        for (let i = 0; i < numbers.length; i++) {
            const num = numbers[i];
            usedNums.push(num);
            expression += num.toString();

            if (i < numbers.length - 1) {
                const op = operations[getRandomInt(0, operations.length)];
                expression += op;
            }
        }

        try {
            const result = eval(expression);

            if (!isNaN(result) && isFinite(result) && Number.isInteger(result)) {
                if ((maxTarget === null || Math.abs(result) <= maxTarget) && (!positiveOnly || result > 0)) {
                    return { expression, result };
                }
            }
        } catch (e) {
        }
    }

    return null;
}

function setupNumberPad() {
    numberPad.innerHTML = '';

    givenNumbers.forEach((number, index) => {
        const button = document.createElement('div');
        button.className = 'number-button';
        button.textContent = number;
        button.dataset.numberIndex = index;
        numberPad.appendChild(button);
    });

    const operators = ['+', '−', '×', '÷'];
    operators.forEach(operator => {
        const button = document.createElement('div');
        button.className = 'operator-button';
        button.textContent = operator;
        numberPad.appendChild(button);
    });

    const utilities = ['(', ')', '←', 'CLR'];
    utilities.forEach(action => {
        const button = document.createElement('div');
        button.className = 'utility-button';
        button.textContent = action;
        numberPad.appendChild(button);
    });

    addNumberPadListeners();
}

function addNumberPadListeners() {
    const numberButtons = document.querySelectorAll('.number-button');
    const operatorButtons = document.querySelectorAll('.operator-button');
    const utilityButtons = document.querySelectorAll('.utility-button');

    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            const number = button.textContent;
            const index = button.dataset.numberIndex;

            if (!usedNumbers.includes(index)) {
                inputTokens.push({ type: 'number', value: number, index: index });
                calculation = inputTokens.map(token => token.value).join('');
                usedNumbers.push(index);
                button.classList.add('used');
                updateCalculationDisplay();
            } else {
                showFeedback(`You've already used the number ${number}.`, 'error');
            }
        });
    });

    operatorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const operator = button.textContent;
            inputTokens.push({ type: 'operator', value: convertOperator(operator) });
            calculation = inputTokens.map(token => token.value).join('');
            updateCalculationDisplay();
        });
    });

    utilityButtons.forEach(button => {
        const action = button.textContent;
        button.addEventListener('click', () => {
            if (action === '←') {
                backspace();
            } else if (action === 'CLR') {
                clearCalculation();
            } else if (action === '(' || action === ')') {
                inputTokens.push({ type: 'parenthesis', value: action });
                calculation = inputTokens.map(token => token.value).join('');
                updateCalculationDisplay();
            }
        });
    });

    submitButton.addEventListener('click', submitAnswer);
}

function updateCalculationDisplay() {
    calculationDisplay.textContent = calculation;
}

function convertOperator(operator) {
    switch (operator) {
        case '×':
            return '*';
        case '÷':
            return '/';
        case '−':
            return '-';
        case '+':
            return '+';
        default:
            return '';
    }
}

function backspace() {
    if (inputTokens.length > 0) {
        const lastToken = inputTokens.pop();

        if (lastToken.type === 'number') {
            const index = lastToken.index;
            usedNumbers = usedNumbers.filter(i => i !== index);

            const numberButtons = document.querySelectorAll('.number-button');
            numberButtons.forEach(button => {
                if (button.dataset.numberIndex == index) {
                    button.classList.remove('used');
                }
            });
        }

        calculation = inputTokens.map(token => token.value).join('');
        updateCalculationDisplay();
    }
}

function clearCalculation() {
    calculation = "";
    usedNumbers = [];
    inputTokens = [];
    updateCalculationDisplay();
    feedbackDisplay.textContent = "";

    const numberButtons = document.querySelectorAll('.number-button');
    numberButtons.forEach(button => {
        button.classList.remove('used');
    });
}

function submitAnswer() {
    if (calculation === "") {
        showFeedback("Please enter a calculation.", 'error');
        return;
    }

    try {
        const result = evaluateCalculation(calculation);

        if (result === targetNumber && areAllNumbersUsed()) {
            showFeedback("🎉 Correct! You reached the target number!", 'success');
            playSuccessAnimation();
            setTimeout(() => {
                finalLevelDisplay.textContent = level;
                showScreen('end-screen');
            }, 2000);
        } else if (result === targetNumber) {
            showFeedback("Almost there! Make sure to use all the given numbers.", 'warning');
        } else {
            showFeedback(`Your result is ${result}. Try again!`, 'error');
        }
    } catch (error) {
        showFeedback("Invalid calculation. Please check your input.", 'error');
    }
}

function areAllNumbersUsed() {
    return usedNumbers.length === givenNumbers.length;
}

function evaluateCalculation(calc) {
    const validChars = /^[0-9+\-*/() ]+$/;
    if (!validChars.test(calc)) {
        throw new Error("Invalid characters in calculation.");
    }

    const result = eval(calc);
    return Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
}

function showFeedback(message, type) {
    feedbackDisplay.textContent = message;

    if (type === 'success') {
        feedbackDisplay.style.color = '#388e3c';
    } else if (type === 'warning') {
        feedbackDisplay.style.color = '#fbc02d';
    } else {
        feedbackDisplay.style.color = '#d32f2f';
    }
}

function playSuccessAnimation() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';

    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = getRandomColor();
        confettiContainer.appendChild(confetti);
    }

    document.body.appendChild(confettiContainer);

    setTimeout(() => {
        confettiContainer.remove();
    }, 2000);
}

function getRandomColor() {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#795548'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const screenToShow = document.getElementById(screenId);
    screenToShow.classList.add('active');
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
}

initGame();