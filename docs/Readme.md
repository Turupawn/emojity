# Structure of a Contract

## Emojidity Version

## Install ERC

## State variable

State variables are variables whose values are permanently stored in contract storage.

```
🗺️💰
```

## Constructor

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

Function Calls can either be view or public. Functions accept parameters and return variables to pass parameters and values between them.

### Visibility

#### 👀 View

Functions can be declared view in which case they promise not to modify the state.

#### 📢 Public

Functions can be declared public in which case they can modify the state.

### Parameters

### Return value

# Types

## Uint

## Bool

## Address

## String

## Mapping

## 2 Dimensional Mapping

### Cheatsheet

## Example contract

## Example ERC20






# State variable declaration

## Mapping
🗺️ EMOJI

## 2 Dimensional Mapping
🗺️🗺️ EMOJI

# Constructor

INSTRUCTIONS

# Functions

NAME VISIBILITY PARAMS ↩️ RETURN_TYPE
🏁
  INSTRUCTIONS
🔚

Name: 2 Emoji Name

## Visibility
👀 View
📢 Non payable

## Params

TYPE NAME

TYPE 🔢#️⃣🔡☯️
NAME 🍓🍇🍑🍊🍒

## RETURN_TYPE
🔢#️⃣🔡☯️

# Instructions
Return
Literal
Read variable
msg.sender
Addition
Subtraction
REVERT


## VALUE
LITERAL
VARIABLE
ADDITION
SUBTRACTION
GREATER_THAN
LESS_THAN

## Return
↩️ VALUE

## Store
VARIABLE 📥 VALUE

## Load
VARIABLE 📤 VALUE

## Condition
❓VARIABLE
🏁
  INSTRUCTIONS
🔚

## Revert
❌



## Literal
1️⃣8️⃣

## Variable
Fruits

## Addition
VALUE ➕ VALUE

## Subtraction
VALUE ➖ VALUE

## Greather_THAN
VALUE ⬆️ VALUE

## LESS_THAN
VALUE ⬇️ VALUE


## Emojidity by Example

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

### Counter Contract

```
🔢🍇

🍇🔼👀↩️🔢
🏁
  🍇📥🍇➕1️⃣
  ↩️🍇
🔚

🍇❓📢↩️🔢
🏁
  ↩️🍇
🔚
```