# LifeVault

LifeVault is a personal safety, memory, and future-message vault.

It includes:

- Emergency profile with quick access that does not require the vault passcode
- Date-locked time capsules
- Dream journal with keyword and mood pattern analysis
- Legacy notes
- Memory Lane records
- A C CLI assignment version using structures, pointers, and file handling

## Website Demo

Default vault passcode: `1234`

Emergency card: quick access without the vault passcode

## Run Locally

```powershell
node server.js
```

Open `http://localhost:3001`.

## Compile the C Program

```powershell
gcc lifevault.c -o lifevault
.\lifevault.exe
```

The C program saves records in `lifevault_records.txt`.
