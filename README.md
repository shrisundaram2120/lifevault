# LifeVault

LifeVault is a personal safety and life-management vault.

It includes:

- Emergency profile with quick access that does not require the vault passcode
- A join/login portal that remembers the user by Gmail
- Passcode or password preference for each vault user
- C login details stored in `vault_passcode.txt`
- Diary Portal with a diary front page, cover page, personal details page, and unlimited editable diary pages
- Future Message Portal with hidden messages that unlock by viewing date/time
- Legacy Instruction Portal with multiple asset sections and dynamic questions for land, house, property, items, vehicles, jewellery, bank notes, and other belongings
- Memory Portal with memory-card style records for important experiences
- Goal Portal with progress notes, initiatives, and practical next-step suggestions
- Insights dashboard for overall vault patterns and entries worth revisiting
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
