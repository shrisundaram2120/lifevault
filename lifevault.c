#include <stdio.h>
#include <string.h>
#include <time.h>

#define MAX_RECORDS 80
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
    char type[40];
    char mood[30];
    char tags[TEXT_SIZE];
    char unlockDate[DATE_SIZE];
    char outcome[30];
    int stressLevel;
    int energyLevel;
    char decision[TEXT_SIZE];
    char body[TEXT_SIZE];
} LifeRecord;

void clearInputBuffer(void);
void readLine(char text[], int size);
void initializeEmergencyProfile(EmergencyProfile *profile);
void createEmergencyProfile(EmergencyProfile *profile);
void showEmergencyProfile(const EmergencyProfile *profile);
void addLifeRecord(LifeRecord records[], int *recordCount);
void viewLifeTimeline(LifeRecord records[], int recordCount);
void analyzeLifeSignals(const LifeRecord records[], int recordCount);
void displayVaultReport(const LifeRecord records[], int recordCount);
void saveRecordToFile(const LifeRecord *record);
int calculateRecordRisk(const LifeRecord *record);
int isRecordLocked(const LifeRecord *record);
int dateToNumber(const char date[]);
int todayToNumber(void);

int main(void) {
    EmergencyProfile profile;
    LifeRecord records[MAX_RECORDS];
    int recordCount = 0;
    int startChoice = 0;
    int choice = 0;
    int unlocked = 0;
    char passcode[20];

    initializeEmergencyProfile(&profile);

    do {
        printf("=====================================\n");
        printf("              LIFEVAULT\n");
        printf(" Personal Life Record System\n");
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
        printf("\n-------------- LIFEVAULT --------------\n");
        printf("1. Update Emergency Profile\n");
        printf("2. Show Emergency Card\n");
        printf("3. Add Life Record\n");
        printf("4. View Life Timeline\n");
        printf("5. Analyze Life Signals\n");
        printf("6. Display Vault Report\n");
        printf("7. Exit\n");
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
                addLifeRecord(records, &recordCount);
                break;
            case 4:
                viewLifeTimeline(records, recordCount);
                break;
            case 5:
                analyzeLifeSignals(records, recordCount);
                break;
            case 6:
                displayVaultReport(records, recordCount);
                break;
            case 7:
                printf("LifeVault locked. Records saved to %s.\n", FILE_NAME);
                break;
            default:
                printf("Invalid choice.\n");
        }
    } while (choice != 7);

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

void createEmergencyProfile(EmergencyProfile *profile) {
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

void addLifeRecord(LifeRecord records[], int *recordCount) {
    LifeRecord *record;

    if (*recordCount >= MAX_RECORDS) {
        printf("Life record storage is full.\n");
        return;
    }

    record = &records[*recordCount];

    printf("\nRecord title: ");
    readLine(record->title, TITLE_SIZE);
    printf("Record type (Life Event/Future Message/Dream Signal/Legacy Instruction/Memory): ");
    readLine(record->type, sizeof(record->type));
    printf("Mood: ");
    readLine(record->mood, sizeof(record->mood));
    printf("Tags or keywords: ");
    readLine(record->tags, TEXT_SIZE);
    printf("Unlock date if future record (YYYY-MM-DD or blank): ");
    readLine(record->unlockDate, DATE_SIZE);
    printf("Outcome (Good/Neutral/Bad/Pending): ");
    readLine(record->outcome, sizeof(record->outcome));
    printf("Stress level (1-10): ");
    scanf("%d", &record->stressLevel);
    clearInputBuffer();
    printf("Energy level (1-10): ");
    scanf("%d", &record->energyLevel);
    clearInputBuffer();
    printf("Decision, promise, or main thought: ");
    readLine(record->decision, TEXT_SIZE);
    printf("Life record body: ");
    readLine(record->body, TEXT_SIZE);

    if (record->stressLevel < 1) {
        record->stressLevel = 1;
    } else if (record->stressLevel > 10) {
        record->stressLevel = 10;
    }

    if (record->energyLevel < 1) {
        record->energyLevel = 1;
    } else if (record->energyLevel > 10) {
        record->energyLevel = 10;
    }

    (*recordCount)++;
    saveRecordToFile(record);
    printf("Life record saved.\n");
}

void viewLifeTimeline(LifeRecord records[], int recordCount) {
    int i;

    if (recordCount == 0) {
        printf("No life records saved.\n");
        return;
    }

    printf("\n---------- Life Timeline ----------\n");
    for (i = 0; i < recordCount; i++) {
        printf("\n%d. %s [%s]\n", i + 1, records[i].title, records[i].type);
        printf("Mood: %s | Stress: %d/10 | Energy: %d/10\n",
               records[i].mood, records[i].stressLevel, records[i].energyLevel);
        printf("Outcome: %s | Risk Score: %d/100\n",
               records[i].outcome, calculateRecordRisk(&records[i]));
        printf("Tags: %s\n", records[i].tags);

        if (isRecordLocked(&records[i])) {
            printf("Body: Locked until %s\n", records[i].unlockDate);
        } else {
            printf("Decision: %s\n", records[i].decision);
            printf("Body: %s\n", records[i].body);
        }
    }
}

void analyzeLifeSignals(const LifeRecord records[], int recordCount) {
    int i;
    int riskScore;
    int highRiskCount = 0;
    int lockedCount = 0;
    int badOutcomeCount = 0;
    int totalStress = 0;
    int totalEnergy = 0;

    if (recordCount == 0) {
        printf("No life records to analyze.\n");
        return;
    }

    printf("\n---------- Life Signal Analyzer ----------\n");
    for (i = 0; i < recordCount; i++) {
        riskScore = calculateRecordRisk(&records[i]);
        totalStress += records[i].stressLevel;
        totalEnergy += records[i].energyLevel;

        if (riskScore >= 70) {
            highRiskCount++;
            printf("Attention: %s has high risk score %d/100.\n", records[i].title, riskScore);
        }

        if (isRecordLocked(&records[i])) {
            lockedCount++;
        }

        if (strcmp(records[i].outcome, "Bad") == 0 || strcmp(records[i].outcome, "bad") == 0) {
            badOutcomeCount++;
        }
    }

    printf("\nAverage stress: %d/10\n", totalStress / recordCount);
    printf("Average energy: %d/10\n", totalEnergy / recordCount);
    printf("High-risk life records: %d\n", highRiskCount);
    printf("Bad outcomes: %d\n", badOutcomeCount);
    printf("Locked future records: %d\n", lockedCount);

    if (highRiskCount > 0 || badOutcomeCount > 1) {
        printf("Main signal: repeated stress, low energy, or bad outcomes need attention.\n");
    } else {
        printf("Main signal: no strong risk pattern detected yet.\n");
    }
}

void displayVaultReport(const LifeRecord records[], int recordCount) {
    int i;
    int futureCount = 0;
    int dreamCount = 0;
    int legacyCount = 0;
    int memoryCount = 0;
    int eventCount = 0;

    for (i = 0; i < recordCount; i++) {
        if (strstr(records[i].type, "Future") != NULL) {
            futureCount++;
        } else if (strstr(records[i].type, "Dream") != NULL) {
            dreamCount++;
        } else if (strstr(records[i].type, "Legacy") != NULL) {
            legacyCount++;
        } else if (strstr(records[i].type, "Memory") != NULL) {
            memoryCount++;
        } else {
            eventCount++;
        }
    }

    printf("\n---------- Vault Report ----------\n");
    printf("Total life records: %d\n", recordCount);
    printf("Life events: %d\n", eventCount);
    printf("Future messages: %d\n", futureCount);
    printf("Dream signals: %d\n", dreamCount);
    printf("Legacy instructions: %d\n", legacyCount);
    printf("Memories or goals: %d\n", memoryCount);
}

void saveRecordToFile(const LifeRecord *record) {
    FILE *file = fopen(FILE_NAME, "a");

    if (file == NULL) {
        printf("Warning: Could not save record to file.\n");
        return;
    }

    fprintf(file, "[Life Record]\n");
    fprintf(file, "Title: %s\n", record->title);
    fprintf(file, "Type: %s\n", record->type);
    fprintf(file, "Mood: %s\n", record->mood);
    fprintf(file, "Stress: %d\n", record->stressLevel);
    fprintf(file, "Energy: %d\n", record->energyLevel);
    fprintf(file, "Outcome: %s\n", record->outcome);
    fprintf(file, "Tags: %s\n", record->tags);
    fprintf(file, "Decision: %s\n", record->decision);
    fprintf(file, "Body: %s\n\n", record->body);
    fclose(file);
}

int calculateRecordRisk(const LifeRecord *record) {
    int score = 0;

    score += record->stressLevel * 7;
    score += (10 - record->energyLevel) * 4;

    if (strcmp(record->outcome, "Bad") == 0 || strcmp(record->outcome, "bad") == 0) {
        score += 20;
    } else if (strcmp(record->outcome, "Neutral") == 0 || strcmp(record->outcome, "neutral") == 0 ||
               strcmp(record->outcome, "Pending") == 0 || strcmp(record->outcome, "pending") == 0) {
        score += 8;
    }

    if (strcmp(record->mood, "Anxious") == 0 || strcmp(record->mood, "Stressed") == 0 ||
        strcmp(record->mood, "Angry") == 0 || strcmp(record->mood, "Low") == 0 ||
        strcmp(record->mood, "anxious") == 0 || strcmp(record->mood, "stressed") == 0 ||
        strcmp(record->mood, "angry") == 0 || strcmp(record->mood, "low") == 0) {
        score += 12;
    }

    if (score > 100) {
        score = 100;
    }

    return score;
}

int isRecordLocked(const LifeRecord *record) {
    if (strlen(record->unlockDate) == 0) {
        return 0;
    }

    return todayToNumber() < dateToNumber(record->unlockDate);
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
