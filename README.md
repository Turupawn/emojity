# Emoji EVM Language

The emoji language for the Ethereum Virtual Machine.

## Run the web compiler

```
npm i -g lite-server
lite-server
```

## Emojidity by Example

### Counter Contract

```
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

### ERC20 Token

```
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

## Instructions

## Return

```
↩️ VALUE
```

## Assignment

```
VARIABLE 📥 VALUE
```

## If Statement

```
❓VARIABLE
🏁
  INSTRUCTIONS
🔚
```

## Loop

```
🔄VARIABLE
🏁
  INSTRUCTIONS
🔚
```

## Addition

```
VARIABLE 📥 VALUE ➕ VALUE
```

## Subtraction

```
VARIABLE 📥 VALUE ➖ VALUE
```

## Logs (Events)

```
📑 NAME 📑 TOPIC1 📑 TOPIC2 📑 TOPIC3
```

* Name is a 2 emoji signature
* Up to 4 topics allowed

Example:
```
📑🪙🚚📑👤📑🍓📑🍇
```