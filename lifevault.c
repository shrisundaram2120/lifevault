#include <stdio.h>
#include <string.h>
#include <time.h>

#define MAX_RECORDS 50
#define TEXT_SIZE 300
#define TITLE_SIZE 80
#define NAME_SIZE 60
#define DATE_SIZE 12
#define FILE_NAME "lifevault_records.txt"

typedef struct {
    char fullName[NAME_SIZE];
    char bloodGroup[20];
    char allergies[TEXT_SIZE];
    char medicalNotes[TEXT_SIZE];
    char contactName[NAME_SIZE];
    char contactPhone[30];
    char routine[TEXT_SIZE];
} EmergencyProfile;

typedef struct {
    char title[TITLE_SIZE];
    char unlockDate[DATE_SIZE];
    char message[TEXT_SIZE];
    int opened;
} TimeCapsule;

typedef struct {
    char title[TITLE_SIZE];
    char mood[30];
    char keywords[TEXT_SIZE];
    char notes[TEXT_SIZE];
} DreamEntry;

typedef struct {
    char title[TITLE_SIZE];
    char category[50];
    char message[TEXT_SIZE];
} LegacyNote;

typedef struct {
    char title[TITLE_SIZE];
    char category[50];
    char message[TEXT_SIZE];
} MemoryEntry;

typedef struct {
    char title[TITLE_SIZE];
    char mood[30];
    int stressLevel;
    int energyLevel;
    char decision[TEXT_SIZE];
    char outcome[30];
    char notes[TEXT_SIZE];
} BlackBoxEvent;

void clearInputBuffer(void);
void readLine(char text[], int size);
void initializeEmergencyProfile(EmergencyProfile *profile);
void saveTextRecord(const char type[], const char title[], const char detail[]);
void createEmergencyProfile(EmergencyProfile *profile);
void showEmergencyProfile(const EmergencyProfile *profile);
void addTimeCapsule(TimeCapsule capsules[], int *capsuleCount);
void viewTimeCapsules(TimeCapsule capsules[], int capsuleCount);
void addDreamEntry(DreamEntry dreams[], int *dreamCount);
void analyzeDreamPatterns(const DreamEntry dreams[], int dreamCount);
void addLegacyNote(LegacyNote notes[], int *noteCount);
void addMemoryEntry(MemoryEntry memories[], int *memoryCount);
void addBlackBoxEvent(BlackBoxEvent events[], int *eventCount);
void analyzeBlackBoxEvents(const BlackBoxEvent events[], int eventCount);
void displaySimpleReport(const LegacyNote notes[], int noteCount,
                         const MemoryEntry memories[], int memoryCount);
int calculateBlackBoxRisk(const BlackBoxEvent *event);
int dateToNumber(const char date[]);
int todayToNumber(void);

int main(void) {
    EmergencyProfile profile;
    TimeCapsule capsules[MAX_RECORDS];
    DreamEntry dreams[MAX_RECORDS];
    LegacyNote legacyNotes[MAX_RECORDS];
    MemoryEntry memories[MAX_RECORDS];
    BlackBoxEvent blackBoxEvents[MAX_RECORDS];
    int capsuleCount = 0;
    int dreamCount = 0;
    int noteCount = 0;
    int memoryCount = 0;
    int blackBoxCount = 0;
    int choice = 0;
    int startChoice = 0;
    int unlocked = 0;
    char passcode[20];

    initializeEmergencyProfile(&profile);

    do {
        printf("=====================================\n");
        printf("              LIFEVAULT\n");
        printf(" Personal Safety and Memory System\n");
        printf("=====================================\n");
        printf("1. View Emergency Card\n");
        printf("2. Unlock Full Vault\n");
        printf("3. Exit\n");
        printf("Enter your choice: ");

        if (scanf("%d", &startChoice) != 1) {
            printf("Invalid input.\n");
            clearInputBuffer();
            continue;
        }
        clearInputBuffer();

        if (startChoice == 1) {
            showEmergencyProfile(&profile);
        } else if (startChoice == 2) {
            printf("Enter vault passcode: ");
            readLine(passcode, sizeof(passcode));

            if (strcmp(passcode, "1234") == 0) {
                unlocked = 1;
            } else {
                printf("Access denied.\n");
            }
        } else if (startChoice == 3) {
            printf("LifeVault closed.\n");
            return 0;
        } else {
            printf("Invalid choice.\n");
        }
    } while (!unlocked);

    do {
        printf("\n-------------- MENU --------------\n");
        printf("1. Create Emergency Profile\n");
        printf("2. Show Emergency Profile\n");
        printf("3. Create Time Capsule\n");
        printf("4. View Time Capsules\n");
        printf("5. Add Dream Entry\n");
        printf("6. Analyze Dream Patterns\n");
        printf("7. Add Legacy Note\n");
        printf("8. Add Memory Lane Entry\n");
        printf("9. Add Human Black Box Event\n");
        printf("10. Analyze Human Black Box\n");
        printf("11. Display Vault Report\n");
        printf("12. Exit\n");
        printf("Enter your choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("Invalid input.\n");
            clearInputBuffer();
            continue;
        }
        clearInputBuffer();

        switch (choice) {
            case 1:
                createEmergencyProfile(&profile);
                break;
            case 2:
                showEmergencyProfile(&profile);
                break;
            case 3:
                addTimeCapsule(capsules, &capsuleCount);
                break;
            case 4:
                viewTimeCapsules(capsules, capsuleCount);
                break;
            case 5:
                addDreamEntry(dreams, &dreamCount);
                break;
            case 6:
                analyzeDreamPatterns(dreams, dreamCount);
                break;
            case 7:
                addLegacyNote(legacyNotes, &noteCount);
                break;
            case 8:
                addMemoryEntry(memories, &memoryCount);
                break;
            case 9:
                addBlackBoxEvent(blackBoxEvents, &blackBoxCount);
                break;
            case 10:
                analyzeBlackBoxEvents(blackBoxEvents, blackBoxCount);
                break;
            case 11:
                displaySimpleReport(legacyNotes, noteCount, memories, memoryCount);
                printf("Time capsules: %d\n", capsuleCount);
                printf("Dream entries: %d\n", dreamCount);
                printf("Human Black Box events: %d\n", blackBoxCount);
                break;
            case 12:
                printf("LifeVault locked. Records saved to %s.\n", FILE_NAME);
                break;
            default:
                printf("Invalid choice.\n");
        }
    } while (choice != 12);

    return 0;
}

void clearInputBuffer(void) {
    int ch;
    while ((ch = getchar()) != '\n' && ch != EOF) {
    }
}

void readLine(char text[], int size) {
    fgets(text, size, stdin);
    text[strcspn(text, "\n")] = '\0';
}

void initializeEmergencyProfile(EmergencyProfile *profile) {
    strcpy(profile->fullName, "Not added");
    strcpy(profile->bloodGroup, "Not added");
    strcpy(profile->allergies, "Not added");
    strcpy(profile->medicalNotes, "Not added");
    strcpy(profile->contactName, "Not added");
    strcpy(profile->contactPhone, "Not added");
    strcpy(profile->routine, "Not added");
}

void saveTextRecord(const char type[], const char title[], const char detail[]) {
    FILE *file = fopen(FILE_NAME, "a");

    if (file == NULL) {
        printf("Warning: Could not save record to file.\n");
        return;
    }

    fprintf(file, "[%s]\nTitle: %s\nDetails: %s\n\n", type, title, detail);
    fclose(file);
}

void createEmergencyProfile(EmergencyProfile *profile) {
    char fileDetail[TEXT_SIZE * 2];

    printf("\nFull name: ");
    readLine(profile->fullName, NAME_SIZE);
    printf("Blood group: ");
    readLine(profile->bloodGroup, sizeof(profile->bloodGroup));
    printf("Allergies: ");
    readLine(profile->allergies, TEXT_SIZE);
    printf("Medical notes: ");
    readLine(profile->medicalNotes, TEXT_SIZE);
    printf("Emergency contact name: ");
    readLine(profile->contactName, NAME_SIZE);
    printf("Emergency contact phone: ");
    readLine(profile->contactPhone, sizeof(profile->contactPhone));
    printf("Daily routine: ");
    readLine(profile->routine, TEXT_SIZE);

    snprintf(fileDetail, sizeof(fileDetail), "Name: %s, Contact: %s, Blood Group: %s",
             profile->fullName, profile->contactPhone, profile->bloodGroup);
    saveTextRecord("Emergency Profile", profile->fullName, fileDetail);
    printf("Emergency profile saved.\n");
}

void showEmergencyProfile(const EmergencyProfile *profile) {
    printf("\n---------- Emergency Card ----------\n");
    printf("Name: %s\n", profile->fullName);
    printf("Blood Group: %s\n", profile->bloodGroup);
    printf("Allergies: %s\n", profile->allergies);
    printf("Medical Notes: %s\n", profile->medicalNotes);
    printf("Emergency Contact: %s\n", profile->contactName);
    printf("Contact Phone: %s\n", profile->contactPhone);
    printf("Daily Routine: %s\n", profile->routine);
}

void addTimeCapsule(TimeCapsule capsules[], int *capsuleCount) {
    TimeCapsule *capsule;

    if (*capsuleCount >= MAX_RECORDS) {
        printf("Capsule storage is full.\n");
        return;
    }

    capsule = &capsules[*capsuleCount];
    printf("\nCapsule title: ");
    readLine(capsule->title, TITLE_SIZE);
    printf("Unlock date (YYYY-MM-DD): ");
    readLine(capsule->unlockDate, DATE_SIZE);
    printf("Message: ");
    readLine(capsule->message, TEXT_SIZE);
    capsule->opened = 0;

    (*capsuleCount)++;
    saveTextRecord("Time Capsule", capsule->title, capsule->message);
    printf("Time capsule created.\n");
}

void viewTimeCapsules(TimeCapsule capsules[], int capsuleCount) {
    int i;
    int today = todayToNumber();

    if (capsuleCount == 0) {
        printf("No time capsules saved.\n");
        return;
    }

    printf("\n---------- Time Capsules ----------\n");
    for (i = 0; i < capsuleCount; i++) {
        printf("\n%d. %s\n", i + 1, capsules[i].title);
        printf("Unlock Date: %s\n", capsules[i].unlockDate);

        if (today >= dateToNumber(capsules[i].unlockDate)) {
            capsules[i].opened = 1;
            printf("Message: %s\n", capsules[i].message);
        } else {
            printf("Status: Locked until unlock date.\n");
        }
    }
}

void addDreamEntry(DreamEntry dreams[], int *dreamCount) {
    DreamEntry *dream;

    if (*dreamCount >= MAX_RECORDS) {
        printf("Dream journal is full.\n");
        return;
    }

    dream = &dreams[*dreamCount];
    printf("\nDream title: ");
    readLine(dream->title, TITLE_SIZE);
    printf("Mood: ");
    readLine(dream->mood, sizeof(dream->mood));
    printf("Keywords separated by commas: ");
    readLine(dream->keywords, TEXT_SIZE);
    printf("Dream notes: ");
    readLine(dream->notes, TEXT_SIZE);

    (*dreamCount)++;
    saveTextRecord("Dream Entry", dream->title, dream->keywords);
    printf("Dream entry saved.\n");
}

void analyzeDreamPatterns(const DreamEntry dreams[], int dreamCount) {
    int i;

    if (dreamCount == 0) {
        printf("No dream entries to analyze.\n");
        return;
    }

    printf("\n---------- Dream Pattern Report ----------\n");
    for (i = 0; i < dreamCount; i++) {
        printf("%d. %s | Mood: %s | Keywords: %s\n",
               i + 1, dreams[i].title, dreams[i].mood, dreams[i].keywords);
    }
    printf("Repeated keywords across entries may show recurring thoughts or themes.\n");
}

void addLegacyNote(LegacyNote notes[], int *noteCount) {
    LegacyNote *note;

    if (*noteCount >= MAX_RECORDS) {
        printf("Legacy note storage is full.\n");
        return;
    }

    note = &notes[*noteCount];
    printf("\nLegacy note title: ");
    readLine(note->title, TITLE_SIZE);
    printf("Category: ");
    readLine(note->category, sizeof(note->category));
    printf("Message: ");
    readLine(note->message, TEXT_SIZE);

    (*noteCount)++;
    saveTextRecord("Legacy Note", note->title, note->message);
    printf("Legacy note saved.\n");
}

void addMemoryEntry(MemoryEntry memories[], int *memoryCount) {
    MemoryEntry *memory;

    if (*memoryCount >= MAX_RECORDS) {
        printf("Memory Lane storage is full.\n");
        return;
    }

    memory = &memories[*memoryCount];
    printf("\nMemory title: ");
    readLine(memory->title, TITLE_SIZE);
    printf("Category: ");
    readLine(memory->category, sizeof(memory->category));
    printf("Memory: ");
    readLine(memory->message, TEXT_SIZE);

    (*memoryCount)++;
    saveTextRecord("Memory Lane", memory->title, memory->message);
    printf("Memory saved.\n");
}

void addBlackBoxEvent(BlackBoxEvent events[], int *eventCount) {
    BlackBoxEvent *event;
    char fileDetail[TEXT_SIZE * 2];

    if (*eventCount >= MAX_RECORDS) {
        printf("Human Black Box storage is full.\n");
        return;
    }

    event = &events[*eventCount];
    printf("\nEvent title: ");
    readLine(event->title, TITLE_SIZE);
    printf("Mood: ");
    readLine(event->mood, sizeof(event->mood));
    printf("Stress level (1-10): ");
    scanf("%d", &event->stressLevel);
    clearInputBuffer();
    printf("Energy level (1-10): ");
    scanf("%d", &event->energyLevel);
    clearInputBuffer();
    printf("Decision made: ");
    readLine(event->decision, TEXT_SIZE);
    printf("Outcome (Good/Neutral/Bad): ");
    readLine(event->outcome, sizeof(event->outcome));
    printf("Incident notes: ");
    readLine(event->notes, TEXT_SIZE);

    if (event->stressLevel < 1) {
        event->stressLevel = 1;
    } else if (event->stressLevel > 10) {
        event->stressLevel = 10;
    }

    if (event->energyLevel < 1) {
        event->energyLevel = 1;
    } else if (event->energyLevel > 10) {
        event->energyLevel = 10;
    }

    snprintf(fileDetail, sizeof(fileDetail), "Mood: %s, Stress: %d, Energy: %d, Outcome: %s",
             event->mood, event->stressLevel, event->energyLevel, event->outcome);
    (*eventCount)++;
    saveTextRecord("Human Black Box", event->title, fileDetail);
    printf("Human Black Box event saved.\n");
}

void analyzeBlackBoxEvents(const BlackBoxEvent events[], int eventCount) {
    int i;
    int riskScore;
    int highRiskCount = 0;
    int totalStress = 0;
    int totalEnergy = 0;
    int badOutcomeCount = 0;

    if (eventCount == 0) {
        printf("No Human Black Box events to analyze.\n");
        return;
    }

    printf("\n---------- Human Black Box Risk Signals ----------\n");

    for (i = 0; i < eventCount; i++) {
        riskScore = calculateBlackBoxRisk(&events[i]);
        totalStress += events[i].stressLevel;
        totalEnergy += events[i].energyLevel;

        if (riskScore >= 70) {
            highRiskCount++;
        }

        if (strcmp(events[i].outcome, "Bad") == 0 || strcmp(events[i].outcome, "bad") == 0) {
            badOutcomeCount++;
        }

        printf("%d. %s | Risk Score: %d/100 | Mood: %s | Outcome: %s\n",
               i + 1, events[i].title, riskScore, events[i].mood, events[i].outcome);
    }

    printf("\nAverage stress: %d/10\n", totalStress / eventCount);
    printf("Average energy: %d/10\n", totalEnergy / eventCount);
    printf("High-risk events: %d\n", highRiskCount);
    printf("Bad outcomes: %d\n", badOutcomeCount);

    if (highRiskCount > 0) {
        printf("Risk signal: Repeated stress, low energy, or bad outcomes need attention.\n");
    } else {
        printf("No strong risk signal detected from current records.\n");
    }
}

void displaySimpleReport(const LegacyNote notes[], int noteCount,
                         const MemoryEntry memories[], int memoryCount) {
    int i;

    printf("\n---------- Vault Report ----------\n");
    printf("Legacy notes: %d\n", noteCount);
    for (i = 0; i < noteCount; i++) {
        printf("- %s (%s)\n", notes[i].title, notes[i].category);
    }

    printf("Memory entries: %d\n", memoryCount);
    for (i = 0; i < memoryCount; i++) {
        printf("- %s (%s)\n", memories[i].title, memories[i].category);
    }
}

int calculateBlackBoxRisk(const BlackBoxEvent *event) {
    int score = 0;

    score += event->stressLevel * 7;
    score += (10 - event->energyLevel) * 4;

    if (strcmp(event->outcome, "Bad") == 0 || strcmp(event->outcome, "bad") == 0) {
        score += 20;
    } else if (strcmp(event->outcome, "Neutral") == 0 || strcmp(event->outcome, "neutral") == 0) {
        score += 8;
    }

    if (strcmp(event->mood, "Stressed") == 0 || strcmp(event->mood, "Angry") == 0 ||
        strcmp(event->mood, "Low") == 0 || strcmp(event->mood, "stressed") == 0 ||
        strcmp(event->mood, "angry") == 0 || strcmp(event->mood, "low") == 0) {
        score += 12;
    }

    if (score > 100) {
        score = 100;
    }

    return score;
}

int dateToNumber(const char date[]) {
    int year = 0;
    int month = 0;
    int day = 0;
    sscanf(date, "%d-%d-%d", &year, &month, &day);
    return year * 10000 + month * 100 + day;
}

int todayToNumber(void) {
    time_t currentTime = time(NULL);
    struct tm *today = localtime(&currentTime);

    return (today->tm_year + 1900) * 10000 + (today->tm_mon + 1) * 100 + today->tm_mday;
}
