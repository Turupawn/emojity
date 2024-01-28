# Emoji EVM Language

A language to build smart contracts compatible with the Ethereum Virtual Machine using only emojis.

## 🛠 Compile a contract

You can generate
```
npm i -g lite-server
lite-server
```

## Deploy a contract

Install foundry first.

```
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

Then you can deploy using the `cast` command.

```
cast send --legacy --rpc-url YOURRPCURL --private-key YOURPRIVATEKEY --create YOURBYTECODE
```