# LifeVault

LifeVault is a personal safety and life-pattern vault.

It includes:

- Emergency profile with quick access that does not require the vault passcode
- A join/login portal that remembers the user by Gmail
- Passcode or password preference for each vault user
- C login details stored in `vault_passcode.txt`
- One unified Life Record flow for future messages, dream signals, legacy instructions, memories, goals, and life events
- Date-locked future records using `DD-MM-YYYY`
- Mood, stress, energy, outcome, tag, and decision tracking
- Life Signal Analyzer for risk patterns and repeated themes
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
