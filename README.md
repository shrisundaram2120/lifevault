# LifeVault

LifeVault is a personal safety and life-pattern vault.

It includes:

- Emergency profile with quick access that does not require the vault passcode
- A join/login portal that remembers the user by Gmail
- Passcode or password preference for each vault user
- C login details stored in `vault_passcode.txt`
- Online diary-style Life Records for future messages, dream signals, legacy instructions, memories, goals, and life events
- Type-specific diary questions so each record asks only what matches its purpose
- Date-locked future records using `DD-MM-YYYY`
- Mood, tag, date, diary note, and personal reflection tracking
- Diary Pattern Analyzer for repeated themes and entries worth revisiting
- A C CLI assignment version using structures, pointers, and file handling

## Website Demo

Existing old vaults may still use default passcode `1234`. New users create their own passcode or password.

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
