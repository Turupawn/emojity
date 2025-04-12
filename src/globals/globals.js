var _currentToken
var _currentJumpDestination
var _tokens

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