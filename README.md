# emojity

The Emoji language for the Ethereum Virtual Machine.

## Run the web compiler

```
npm i -g lite-server
lite-server
```

## Emojity by Example

### Counter Contract

```
0️⃣🤗0️⃣

🔢🍇

🍇🔼📢↩️🔢
🏁
  🍇📥🍇➕1️⃣
  ↩️🍇
🔚

🍇❓👀↩️🔢
🏁
  ↩️🍇
🔚
```

### Calculator

```
0️⃣🤗0️⃣

🍊➕👀🔢🍇🔢🍓↩️🔢
🏁
  🔢🍊
  🍊📥🍇➕🍓
  ↩️🍊
🔚

🍊➖👀🔢🍇🔢🍓↩️🔢
🏁
  🔢🍊
  🍊📥🍇➖🍓
  ↩️🍊
🔚
```

### Staking

```
0️⃣🤗0️⃣

🗺️🍇

🍇🔼📢↩️🔢
🏁
  🍇👤📥🍇👤➕💰
  ↩️1️⃣
🔚

🍇🔽📢↩️🔢
🏁
  🔢🍓
  🍓📥🍇👤
  🍇👤📥0️⃣
  📡👤📍0️⃣💸🍓⛽0️⃣
  ↩️1️⃣
🔚

🍇❓👀#️⃣🍓↩️🔢
🏁
  ↩️🍇🍓
🔚
```

### ERC20 Token

```
0️⃣🤗0️⃣

🗺️💰
🗺️🛂

👷
🏁
  💰👤📥1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣
  📑🪙🚚📑0️⃣📑👤📑1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣
🔚

🪙💰👀↩️🔢
🏁
  ↩️1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣
🔚

🪙🤑👀#️⃣🍓↩️🔢
🏁
  ↩️💰🍓
🔚

🪙💸📢#️⃣🍓🔢🍇↩️☯️
🏁
  💰👤📥💰👤➖🍇
  💰🍓📥💰🍓➕🍇
  📑🪙🚚📑👤📑🍓📑🍇
  ↩️1️⃣
🔚

🪙🛂👀#️⃣🍓#️⃣🍇↩️🔢
🏁
  ↩️🛂🍓🍇
🔚

🪙✅📢#️⃣🍓🔢🍇↩️☯️
🏁
  🛂👤🍓📥🍇
  ↩️1️⃣
🔚

🪙🏧📢#️⃣🍓#️⃣🍇🔢🍊↩️☯️
🏁
  🛂🍓👤📥🛂🍓👤➖🍊
  💰🍓📥💰🍓➖🍊
  💰🍇📥💰🍇➕🍊
  📑🪙🚚📑🍓📑🍇📑🍊
  ↩️1️⃣
🔚

🪙📛👀↩️🔡
🏁
  ↩️8️⃣3️⃣9️⃣3️⃣2️⃣6️⃣7️⃣4️⃣7️⃣5️⃣6️⃣3️⃣2️⃣9️⃣7️⃣7️⃣3️⃣7️⃣3️⃣6️⃣8️⃣7️⃣9️⃣4️⃣7️⃣0️⃣
🔚

🪙🆔👀↩️🔡
🏁
  ↩️2️⃣9️⃣7️⃣6️⃣4️⃣9️⃣7️⃣8️⃣5️⃣4️⃣1️⃣7️⃣
🔚

🪙🥧👀↩️🔢8️⃣
🏁
  ↩️1️⃣8️⃣
🔚
```

### A swap function

```
0️⃣🤗0️⃣

#️⃣🅰️
#️⃣🅱️
🔢🤑
🔢💸
🔢🏧

👷
🏁
  🅰️📥6️⃣2️⃣8️⃣6️⃣6️⃣7️⃣9️⃣0️⃣9️⃣2️⃣3️⃣9️⃣2️⃣8️⃣7️⃣4️⃣5️⃣1️⃣6️⃣6️⃣1️⃣0️⃣1️⃣5️⃣3️⃣7️⃣6️⃣5️⃣0️⃣9️⃣5️⃣4️⃣8️⃣1️⃣9️⃣6️⃣7️⃣1️⃣4️⃣5️⃣4️⃣8️⃣3️⃣7️⃣6️⃣5️⃣4️⃣6️⃣
  🅱️📥6️⃣8️⃣5️⃣3️⃣6️⃣6️⃣7️⃣7️⃣6️⃣8️⃣3️⃣7️⃣9️⃣6️⃣6️⃣0️⃣7️⃣6️⃣6️⃣7️⃣7️⃣6️⃣9️⃣8️⃣7️⃣5️⃣0️⃣5️⃣8️⃣4️⃣7️⃣2️⃣6️⃣1️⃣1️⃣3️⃣2️⃣7️⃣8️⃣0️⃣2️⃣9️⃣5️⃣0️⃣6️⃣9️⃣5️⃣2️⃣
  🤑📥1️⃣8️⃣8️⃣9️⃣5️⃣6️⃣7️⃣2️⃣8️⃣1️⃣
  💸📥2️⃣8️⃣3️⃣5️⃣7️⃣1️⃣7️⃣3️⃣0️⃣7️⃣
  🏧📥5️⃣9️⃣9️⃣2️⃣9️⃣0️⃣5️⃣8️⃣9️⃣
🔚

🅰️🅱️📢🔢🍓🔢🍇↩️☯️
🏁
  🔢🍎
  🔢🍌
  🔢⏳
  🔢⌛️
  ☯️🤔
  📡🅰️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍎
  📡🅱️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍌
  ⏳📥🍎✖️🍌
  📡🅰️📍🏧💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👤#️⃣👇🔢🍓
  📡🅱️📍💸💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👤🔢🍇
  📡🅰️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍎
  📡🅱️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍌
  ⌛️📥🍎✖️🍌
  🤔📥⌛️⬇️⏳
  ❓🤔
  🏁
    ❌
  🔚
  ↩️1️⃣
🔚

🅱️🅰️📢🔢🍓🔢🍇↩️☯️
🏁
  🔢🍎
  🔢🍌
  🔢⏳
  🔢⌛️
  ☯️🤔
  📡🅰️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍎
  📡🅱️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍌
  ⏳📥🍎✖️🍌
  📡🅱️📍🏧💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👤#️⃣👇🔢🍓
  📡🅰️📍💸💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👤🔢🍇
  📡🅰️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍎
  📡🅱️📍🤑💸0️⃣⛽1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣#️⃣👇📥🍌
  ⌛️📥🍎✖️🍌
  🤔📥⌛️⬇️⏳
  ❓🤔
  🏁
    ❌
  🔚
  ↩️1️⃣
🔚
```


### Int to string

```
0️⃣🤗0️⃣

🍩🍑👀🔢🍑↩️🔡
🏁
  🔢🍐
  🔡🍇
  🔢🥭
  🔢🍩
  🔢🍅
  🔢🍎
  🔢🍊
  🍐📥🍑
  🥭📥1️⃣
  🔄🍐
  🏁
    🍩📥🍐
    🍅📥🍐➗1️⃣0️⃣
    🍅📥🍅✖️1️⃣0️⃣
    🍩📥🍩➖🍅
    🍎📥🍩➕4️⃣8️⃣
    🍊📥🍎✖️🥭
    🍇📥🍇➕🍊
    🥭📥🥭✖️2️⃣5️⃣6️⃣
    🍐📥🍐➗1️⃣0️⃣
  🔚
  ↩️🍇
🔚
```

## Structure of a Contract

The following is the structure of a contract.

```
STATE_VARIABLES

CONSTRUCTOR (Optional)

FUNCTION_1

FUNCTION_2

FUNCTION_3

...
```

### State variables

State variables are variables whose values are permanently stored in contract storage.

```
🔢🍓 // Uint variable declared on the stack
🗺️💰 // This is hashmap
```

## Constructor

The costructor code will be executed only once, when the contract is deployed.

```
👷
🏁
  💰👤📥1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣
  📑🪙🚚📑0️⃣📑👤📑1️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣0️⃣
🔚
```

## Functions

Functions are the executable units of code.

```
🪙🥧👀↩️🔢8️⃣
🏁
  ↩️1️⃣8️⃣
🔚
```

Function Calls can either be 👀 view or 📢 public. Functions accept parameters and return variables to pass parameters and values between them.

Functions are composed by:

* A name, 2 emoji identifiers
* Visibility, 👀 for view and 📢 for public
* Parameters (optional), composed of the type and 1 emoji identifier
* A return value
* Instructions

The following is the syntaxis of a function:

```
NAME VISIBILITY PARAMS ↩️ RETURN_TYPE
🏁
  INSTRUCTIONS
🔚
```

## Types

| Emoji | Type |
|-------|------|
| 🔢 | unsigned intenger |
| 🔡 | string |
| #️⃣ | address |
| 🗺️ | mapping |
| ☯️ | boolean |

## Special emojis

| Emoji | Type |
|-------|------|
| 👤 | The caller address, `msg.sender` on solidity |
| 👇 | Current contract address, `this` on solidity |
| 💰 | Ether amount sent, `msg.value` on solidity |

## Instructions

## Return

Gracefully stops the function execution and returns a value.

```
↩️ VALUE
```

Example:

```
↩️🍓
```

## Assignment

Assigns a value to a variable. Notice function parameters are not assignable.

```
VARIABLE 📥 VALUE
```

Example:

```
🍓📥🍇
```

## Arithmetic Operators

Perform an airthmetic operation between two values.

```
VARIABLE 📥 VALUE OPERATOR VALUE
```

Example:

```
🍓📥🍇➕🍊
```

### Supported Arithmetic Operators

| Operator | Operation |
|-------|------|
| ➕ | Addition |
| ➖ | Subtraction |
| ✖️ | Multiplication |
| ➗ | Division |

## Boolean Operators

Perform an airthmetic operation between two values. Returns 1️⃣ if true, otherwhise returns 0️⃣.

```
VARIABLE 📥 VALUE OPERATOR VALUE
```

Example:

```
🍓📥🍇⬆️🍊
```

### Supported Boolean Operators

| Operator | Operation |
|-------|------|
| ⬆️ | Greater than |
| ⬇️ | Less than |

## If Statement

Executes a set of instructions if a variable value is different than 0.

```
❓VARIABLE
🏁
  INSTRUCTIONS
🔚
```

Example:

```
❓🍓
🏁
  🍓📥🍇
🔚
```

## Loop

Executes repeatedly a set of instructions as long as a variable value is different than 0.

```
🔄VARIABLE
🏁
  INSTRUCTIONS
🔚
```

Example:

```
🔄🍓
🏁
  🍓📥🍓➖1️⃣
  🍇📥🍇➕5️⃣
🔚
```

## Logs (Events)

Logs an event to the blockchain. Notice the name is a 2 emoji signature. Up to 4 topics are supported.

```
📑 NAME 📑 TOPIC1 📑 TOPIC2 📑 TOPIC3
```

Example:
```
📑🪙🚚📑👤📑🍓📑🍇
```

## External calls

Makes a call to an external account. Use this to call a function to an external smart contract or to send eth.

```
📡 EXTERNAL_ACCOUNT_ADDRESS 📍 SELECTOR 💸 ETHER_SENT ⛽ MAXIMUM_GAS_USED
```


Example:
```
📡👤📍0️⃣💸🍓⛽0️⃣
```

# Sonatina support progress

The integration of the Sonatina backend into Emojity is in progress. This is expected to improve security, reduce workload, and support testing new technologies. Below is an update on the current migration progress:

## Instructions

| Instruction | Supported |
|-------------|---------- |
| Operation | 🟨 |
| Return Literal | 🟥 |
| Return Label | 🟨 |
| Assignment | 🟥 |
| Literal Assignment | 🟥 |
| Log Event | 🟥 |
| If Statement | 🟨 |
| While Loop | 🟥 |
| Memory declarations | 🟥 |
| External Call | 🟥 |
| Revert | 🟥 |

## Others

| Type | Supported |
|------|---------- |
| Calldata variables | 🟨 |
| Memory variables | 🟥 |
| State variables | 🟥 |
| Mappings | 🟥 |
| Constructor | 🟥 |
| `CALLER` opcode 0x33 | 🟥 |
| `ADDRESS` opcode 0x30 | 🟥 |
| `CALLVALUE` opcode 0x34 | 🟥 |