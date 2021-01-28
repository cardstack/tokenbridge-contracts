### How to run upgrade scripts

Install dependencies in root project and compile the contracts
```bash
cd ..
npm i
npm run compile
```

Install dependencies from `upgrade` folder
```bash
cd upgrade
npm i
```

Create `.env` file
```bash
cp .env.example .env
```

Complete the variables in `.env` file.

Run the script. The following are available:
* `npm run upgradeBridgeOnForeign`
* `npm run upgradeBridgeOnHome`
