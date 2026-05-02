#include <ctype.h>
#include <stdio.h>
#include <string.h>
#include <time.h>

#define MAX_RECORDS 80
#define TEXT_SIZE 300
#define TITLE_SIZE 80
#define NAME_SIZE 60
#define GMAIL_SIZE 80
#define SECRET_SIZE 40
#define DATE_SIZE 12
#define QUESTION_SIZE 90
#define FILE_NAME "lifevault_records.txt"
#define PASSCODE_FILE "vault_passcode.txt"
#define REMEMBERED_FILE "remembered_user.txt"

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
    char entryDate[DATE_SIZE];
    char unlockDate[DATE_SIZE];
    char questionOne[QUESTION_SIZE];
    char answerOne[TEXT_SIZE];
    char questionTwo[QUESTION_SIZE];
    char answerTwo[TEXT_SIZE];
    char questionThree[QUESTION_SIZE];
    char answerThree[TEXT_SIZE];
    char diaryBody[TEXT_SIZE];
} LifeRecord;

typedef struct {
    char name[NAME_SIZE];
    char gmail[GMAIL_SIZE];
    char secretType[20];
    char secret[SECRET_SIZE];
} VaultUser;

void clearInputBuffer(void);
void readLine(char text[], int size);
void initializeEmergencyProfile(EmergencyProfile *profile);
int joinVault(VaultUser *user);
int loginRememberedUser(VaultUser *user);
int loginWithGmail(VaultUser *user);
int findUserByGmail(const char gmail[], VaultUser *user);
void saveRememberedUser(const char gmail[]);
int loadRememberedUser(VaultUser *user);
void createEmergencyProfile(EmergencyProfile *profile);
void showEmergencyProfile(const EmergencyProfile *profile);
void addLifeRecord(LifeRecord records[], int *recordCount);
void chooseRecordType(LifeRecord *record);
void setTypeQuestions(LifeRecord *record);
void viewLifeTimeline(LifeRecord records[], int recordCount);
void analyzeDiaryPatterns(const LifeRecord records[], int recordCount);
void displayVaultReport(const LifeRecord records[], int recordCount);
void saveRecordToFile(const LifeRecord *record);
int isReflectiveRecord(const LifeRecord *record);
int containsIgnoreCase(const char text[], const char keyword[]);
int isRecordLocked(const LifeRecord *record);
int dateToNumber(const char date[]);
int todayToNumber(void);
void todayToDmy(char date[]);

int main(void) {
    EmergencyProfile profile;
    VaultUser activeUser;
    LifeRecord records[MAX_RECORDS];
    int recordCount = 0;
    int startChoice = 0;
    int choice = 0;
    int unlocked = 0;

    initializeEmergencyProfile(&profile);

    do {
        printf("=====================================\n");
        printf("              LIFEVAULT\n");
        printf(" Personal Safety and Diary Vault\n");
        printf("=====================================\n");
        printf("1. View Emergency Card\n");
        printf("2. Join / Create Vault\n");
        printf("3. Login Remembered User\n");
        printf("4. Login with Gmail\n");
        printf("5. Exit\n");
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
            if (joinVault(&activeUser)) {
                unlocked = 1;
            }
        } else if (startChoice == 3) {
            if (loginRememberedUser(&activeUser)) {
                unlocked = 1;
            }
        } else if (startChoice == 4) {
            if (loginWithGmail(&activeUser)) {
                unlocked = 1;
            }
        } else if (startChoice == 5) {
            printf("LifeVault closed.\n");
            return 0;
        } else {
            printf("Invalid choice.\n");
        }
    } while (!unlocked);

    do {
        printf("\n-------------- LIFEVAULT: %s --------------\n", activeUser.name);
        printf("1. Update Emergency Profile\n");
        printf("2. Show Emergency Card\n");
        printf("3. Add Diary Life Record\n");
        printf("4. View Diary Timeline\n");
        printf("5. Analyze Diary Patterns\n");
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
                analyzeDiaryPatterns(records, recordCount);
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

int joinVault(VaultUser *user) {
    VaultUser existingUser;

    printf("\nName: ");
    readLine(user->name, NAME_SIZE);
    printf("Gmail: ");
    readLine(user->gmail, GMAIL_SIZE);
    printf("Secret type (passcode/password): ");
    readLine(user->secretType, sizeof(user->secretType));
    printf("Create %s: ", user->secretType);
    readLine(user->secret, SECRET_SIZE);

    if (strlen(user->name) == 0 || strlen(user->gmail) == 0 || strlen(user->secret) == 0) {
        printf("Name, Gmail, and secret are required.\n");
        return 0;
    }

    if (findUserByGmail(user->gmail, &existingUser)) {
        printf("This Gmail already has a vault. Please login instead.\n");
        return 0;
    }

    FILE *file = fopen(PASSCODE_FILE, "a");
    if (file == NULL) {
        printf("Could not open %s for saving.\n", PASSCODE_FILE);
        return 0;
    }

    fprintf(file, "%s|%s|%s|%s\n", user->name, user->gmail, user->secretType, user->secret);
    fclose(file);
    saveRememberedUser(user->gmail);
    printf("Vault created. Your login is saved in %s.\n", PASSCODE_FILE);
    return 1;
}

int loginRememberedUser(VaultUser *user) {
    char enteredSecret[SECRET_SIZE];

    if (!loadRememberedUser(user)) {
        printf("No remembered user found. Please join or login with Gmail.\n");
        return 0;
    }

    printf("Remembered user: %s (%s)\n", user->name, user->gmail);
    printf("Enter %s: ", user->secretType);
    readLine(enteredSecret, SECRET_SIZE);

    if (strcmp(enteredSecret, user->secret) == 0) {
        printf("Vault unlocked.\n");
        return 1;
    }

    printf("Incorrect %s.\n", user->secretType);
    return 0;
}

int loginWithGmail(VaultUser *user) {
    char gmail[GMAIL_SIZE];
    char enteredSecret[SECRET_SIZE];

    printf("\nGmail: ");
    readLine(gmail, GMAIL_SIZE);

    if (!findUserByGmail(gmail, user)) {
        printf("No vault found for this Gmail.\n");
        return 0;
    }

    printf("Enter %s: ", user->secretType);
    readLine(enteredSecret, SECRET_SIZE);

    if (strcmp(enteredSecret, user->secret) == 0) {
        saveRememberedUser(user->gmail);
        printf("Vault unlocked.\n");
        return 1;
    }

    printf("Incorrect %s.\n", user->secretType);
    return 0;
}

int findUserByGmail(const char gmail[], VaultUser *user) {
    FILE *file = fopen(PASSCODE_FILE, "r");
    char line[260];
    char *name;
    char *storedGmail;
    char *secretType;
    char *secret;

    if (file == NULL) {
        return 0;
    }

    while (fgets(line, sizeof(line), file) != NULL) {
        line[strcspn(line, "\n")] = '\0';
        name = strtok(line, "|");
        storedGmail = strtok(NULL, "|");
        secretType = strtok(NULL, "|");
        secret = strtok(NULL, "|");

        if (name == NULL || storedGmail == NULL || secretType == NULL || secret == NULL) {
            continue;
        }

        if (strcmp(storedGmail, gmail) == 0) {
            strcpy(user->name, name);
            strcpy(user->gmail, storedGmail);
            strcpy(user->secretType, secretType);
            strcpy(user->secret, secret);
            fclose(file);
            return 1;
        }
    }

    fclose(file);
    return 0;
}

void saveRememberedUser(const char gmail[]) {
    FILE *file = fopen(REMEMBERED_FILE, "w");

    if (file == NULL) {
        return;
    }

    fprintf(file, "%s\n", gmail);
    fclose(file);
}

int loadRememberedUser(VaultUser *user) {
    FILE *file = fopen(REMEMBERED_FILE, "r");
    char gmail[GMAIL_SIZE];

    if (file == NULL) {
        return 0;
    }

    if (fgets(gmail, sizeof(gmail), file) == NULL) {
        fclose(file);
        return 0;
    }

    fclose(file);
    gmail[strcspn(gmail, "\n")] = '\0';
    return findUserByGmail(gmail, user);
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
    char defaultDate[DATE_SIZE];

    if (*recordCount >= MAX_RECORDS) {
        printf("Life record storage is full.\n");
        return;
    }

    record = &records[*recordCount];
    memset(record, 0, sizeof(LifeRecord));
    todayToDmy(defaultDate);

    printf("\nDiary entry title: ");
    readLine(record->title, TITLE_SIZE);
    printf("Entry date (DD-MM-YYYY, blank for today %s): ", defaultDate);
    readLine(record->entryDate, DATE_SIZE);
    if (strlen(record->entryDate) == 0) {
        strcpy(record->entryDate, defaultDate);
    }

    chooseRecordType(record);

    printf("Mood or feeling: ");
    readLine(record->mood, sizeof(record->mood));
    printf("Tags or keywords: ");
    readLine(record->tags, TEXT_SIZE);

    if (strstr(record->type, "Future") != NULL) {
        printf("Unlock date for this future entry (DD-MM-YYYY): ");
        readLine(record->unlockDate, DATE_SIZE);
    } else {
        strcpy(record->unlockDate, "");
    }

    setTypeQuestions(record);

    printf("%s: ", record->questionOne);
    readLine(record->answerOne, TEXT_SIZE);
    printf("%s: ", record->questionTwo);
    readLine(record->answerTwo, TEXT_SIZE);
    printf("%s: ", record->questionThree);
    readLine(record->answerThree, TEXT_SIZE);
    printf("Extra diary note: ");
    readLine(record->diaryBody, TEXT_SIZE);

    (*recordCount)++;
    saveRecordToFile(record);
    printf("Diary life record saved.\n");
}

void chooseRecordType(LifeRecord *record) {
    int typeChoice = 0;

    printf("\nChoose diary type:\n");
    printf("1. Life Event\n");
    printf("2. Future Message\n");
    printf("3. Dream Signal\n");
    printf("4. Legacy Instruction\n");
    printf("5. Memory or Goal\n");
    printf("Enter type number: ");

    if (scanf("%d", &typeChoice) != 1) {
        typeChoice = 1;
    }
    clearInputBuffer();

    switch (typeChoice) {
        case 2:
            strcpy(record->type, "Future Message");
            break;
        case 3:
            strcpy(record->type, "Dream Signal");
            break;
        case 4:
            strcpy(record->type, "Legacy Instruction");
            break;
        case 5:
            strcpy(record->type, "Memory or Goal");
            break;
        default:
            strcpy(record->type, "Life Event");
            break;
    }
}

void setTypeQuestions(LifeRecord *record) {
    if (strstr(record->type, "Future") != NULL) {
        strcpy(record->questionOne, "What should future you read");
        strcpy(record->questionTwo, "Why should this open later");
        strcpy(record->questionThree, "What reminder should it carry");
    } else if (strstr(record->type, "Dream") != NULL) {
        strcpy(record->questionOne, "What did you see in the dream");
        strcpy(record->questionTwo, "How did it feel after waking up");
        strcpy(record->questionThree, "Which symbols or words repeated");
    } else if (strstr(record->type, "Legacy") != NULL) {
        strcpy(record->questionOne, "Who is this meant for");
        strcpy(record->questionTwo, "What message or instruction should remain");
        strcpy(record->questionThree, "Why is this important");
    } else if (strstr(record->type, "Memory") != NULL || strstr(record->type, "Goal") != NULL) {
        strcpy(record->questionOne, "What memory or goal do you want to keep");
        strcpy(record->questionTwo, "What made it meaningful");
        strcpy(record->questionThree, "What next step or promise belongs with it");
    } else {
        strcpy(record->questionOne, "What happened");
        strcpy(record->questionTwo, "Why did it matter");
        strcpy(record->questionThree, "What did you learn or decide");
    }
}

void viewLifeTimeline(LifeRecord records[], int recordCount) {
    int i;

    if (recordCount == 0) {
        printf("No diary entries saved.\n");
        return;
    }

    printf("\n---------- Diary Timeline ----------\n");
    for (i = 0; i < recordCount; i++) {
        printf("\n%d. %s [%s]\n", i + 1, records[i].title, records[i].type);
        printf("Entry Date: %s | Mood: %s\n", records[i].entryDate, records[i].mood);
        printf("Tags: %s\n", records[i].tags);

        if (isRecordLocked(&records[i])) {
            printf("Diary entry: Locked until %s\n", records[i].unlockDate);
        } else {
            printf("%s: %s\n", records[i].questionOne, records[i].answerOne);
            printf("%s: %s\n", records[i].questionTwo, records[i].answerTwo);
            printf("%s: %s\n", records[i].questionThree, records[i].answerThree);
            printf("Extra Diary Note: %s\n", records[i].diaryBody);
        }
    }
}

void analyzeDiaryPatterns(const LifeRecord records[], int recordCount) {
    int i;
    int lockedCount = 0;
    int revisitCount = 0;
    int taggedCount = 0;

    if (recordCount == 0) {
        printf("No diary entries to analyze.\n");
        return;
    }

    printf("\n---------- Diary Pattern Analyzer ----------\n");
    for (i = 0; i < recordCount; i++) {
        if (isRecordLocked(&records[i])) {
            lockedCount++;
        }

        if (strlen(records[i].tags) > 0) {
            taggedCount++;
        }

        if (!isRecordLocked(&records[i]) && isReflectiveRecord(&records[i])) {
            revisitCount++;
            printf("Revisit suggestion: \"%s\" has a strong feeling or warning keyword.\n", records[i].title);
        }
    }

    printf("\nTotal diary entries: %d\n", recordCount);
    printf("Entries with tags: %d\n", taggedCount);
    printf("Locked future entries: %d\n", lockedCount);
    printf("Entries to revisit: %d\n", revisitCount);

    if (revisitCount > 0) {
        printf("Main signal: some diary entries may need reflection later.\n");
    } else {
        printf("Main signal: no urgent revisit pattern found yet.\n");
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
        } else if (strstr(records[i].type, "Memory") != NULL || strstr(records[i].type, "Goal") != NULL) {
            memoryCount++;
        } else {
            eventCount++;
        }
    }

    printf("\n---------- Vault Report ----------\n");
    printf("Total diary life records: %d\n", recordCount);
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

    fprintf(file, "[Diary Life Record]\n");
    fprintf(file, "Title: %s\n", record->title);
    fprintf(file, "Type: %s\n", record->type);
    fprintf(file, "Entry Date: %s\n", record->entryDate);
    fprintf(file, "Mood: %s\n", record->mood);
    fprintf(file, "Tags: %s\n", record->tags);
    if (strlen(record->unlockDate) > 0) {
        fprintf(file, "Unlock Date: %s\n", record->unlockDate);
    }
    fprintf(file, "%s: %s\n", record->questionOne, record->answerOne);
    fprintf(file, "%s: %s\n", record->questionTwo, record->answerTwo);
    fprintf(file, "%s: %s\n", record->questionThree, record->answerThree);
    fprintf(file, "Extra Diary Note: %s\n\n", record->diaryBody);
    fclose(file);
}

int isReflectiveRecord(const LifeRecord *record) {
    if (containsIgnoreCase(record->mood, "anxious") ||
        containsIgnoreCase(record->mood, "stressed") ||
        containsIgnoreCase(record->mood, "angry") ||
        containsIgnoreCase(record->mood, "low") ||
        containsIgnoreCase(record->mood, "confused")) {
        return 1;
    }

    if (containsIgnoreCase(record->tags, "warning") ||
        containsIgnoreCase(record->tags, "health") ||
        containsIgnoreCase(record->answerOne, "regret") ||
        containsIgnoreCase(record->answerTwo, "mistake") ||
        containsIgnoreCase(record->answerThree, "urgent") ||
        containsIgnoreCase(record->diaryBody, "hurt")) {
        return 1;
    }

    return 0;
}

int containsIgnoreCase(const char text[], const char keyword[]) {
    int i;
    int j;
    int textLength = (int)strlen(text);
    int keywordLength = (int)strlen(keyword);

    if (keywordLength == 0 || keywordLength > textLength) {
        return 0;
    }

    for (i = 0; i <= textLength - keywordLength; i++) {
        for (j = 0; j < keywordLength; j++) {
            if (tolower((unsigned char)text[i + j]) != tolower((unsigned char)keyword[j])) {
                break;
            }
        }

        if (j == keywordLength) {
            return 1;
        }
    }

    return 0;
}

int isRecordLocked(const LifeRecord *record) {
    if (strlen(record->unlockDate) == 0) {
        return 0;
    }

    return todayToNumber() < dateToNumber(record->unlockDate);
}

int dateToNumber(const char date[]) {
    int day = 0;
    int month = 0;
    int year = 0;

    if (sscanf(date, "%d-%d-%d", &day, &month, &year) != 3) {
        return 0;
    }

    return year * 10000 + month * 100 + day;
}

int todayToNumber(void) {
    time_t currentTime = time(NULL);
    struct tm *today = localtime(&currentTime);

    return (today->tm_year + 1900) * 10000 + (today->tm_mon + 1) * 100 + today->tm_mday;
}

void todayToDmy(char date[]) {
    time_t currentTime = time(NULL);
    struct tm *today = localtime(&currentTime);

    sprintf(date, "%02d-%02d-%04d", today->tm_mday, today->tm_mon + 1, today->tm_year + 1900);
}
