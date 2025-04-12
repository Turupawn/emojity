var _currentToken

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