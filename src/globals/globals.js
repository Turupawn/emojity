var _currentToken
var _currentJumpDestination
var _tokens
var _functions
var _stateVariables
var _localVariables

function getCurrentToken() {
    return _currentToken;
}
function advanceToken() {
    _currentToken += 1;
}

function regressToken() {
    _currentToken -= 1;
}

function resetCurrentToken() {
    _currentToken = 0;
}

function getCurrentJumpDestination() {
    return _currentJumpDestination;
}

function addvanceCurrentJumpDestination() {
    _currentJumpDestination += 1;
}

function resetCurrentJumpDestination() {
    _currentJumpDestination = 0;
}

function setTokens(tokens) {
    _tokens = tokens;
}

function getTokensLength() {
    return _tokens.length;
}

function getToken(index) {
    return _tokens[index];
}

function resetFunctions() {
    _functions = [];
}

function getFunctionsLength() {
    return _functions.length;
}

function getFunction(index) {
    return _functions[index];
}

function addFunction(_function) {
    _functions.push(_function);
}

function resetStateVariables() {
    _stateVariables = new Map();
}

function getStateVariable(index) {
    return _stateVariables.get(index);
}

function hasStateVariable(index) {
    return _stateVariables.has(index);
}

function addStateVariable(label, value) {
    _stateVariables.set(label, value);
}

function getStateVariablesSize() {
    return _stateVariables.size;
}

function getStateVariablesEntries() {
    return _stateVariables.entries();
}

function resetLocalVariables() {
    _localVariables = new Map();
}

function setLocalVariables(label, value) {
    _localVariables.set(label, value);
}

function getLocalVariable(index) {
    return _localVariables.get(index);
}

function hasLocalVariable(index) {
    return _localVariables.has(index);
}