### How to run upgrade scripts

Install dependencies in root project and compile and deploy the upgraded contracts

```bash
cd ..
yarn install
yarn run compile
cd deploy
env DEPLOY_IMPLEMENTATIONS_ONLY=true yarn run deploy
```

Install dependencies from `upgrade` folder

```bash
cd upgrade
yarn install
```

Create `.env` file

```bash
cp .env.example .env
```

Complete the variables in `.env` file.

Run the script. The following are available:

- `yarn run upgradeBridgeOnForeign`
- `yarn run upgradeBridgeOnHome`
