# Backend (Spring Boot / Java) Code Style & Checkstyle Rules

## Checkstyle Configuration

The backend uses **Google Java Style** (via `apps/backend/style/google_checks.xml`) enforced by
`maven-checkstyle-plugin` during `mvn clean install`.

## Key Rules

### 1. Javadoc Comments (MissingJavadocType / MissingJavadocMethod)

**Rule:** All public classes, records, interfaces, and public methods must have Javadoc comments.

**Examples:**

**✅ Correct:**

```java
/** Represents a food item consumed by the user. */
public record FoodItemDto(
    @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,
    @NotNull String name,
    int calories
  ) {

}

public interface FoodRepository extends JpaRepository<FoodItem, String> {

  /**
   * Find food items logged on a specific date for a user.
   *
   * @param userId the user ID
   * @param dateLogged the date logged
   * @return list of food items
   */
  List<FoodItem> findByUserIdAndDateLogged(UserId userId, LocalDate dateLogged);
}
```

**❌ Incorrect:**

```java
public record FoodItemDto(
  String id,
  String name
) {

}

public List<FoodItem> findByUserIdAndDateLogged(UserId userId, LocalDate dateLogged);
```

### 2. Indentation (Indentation)

**Rule:** Use **2 spaces = 1 indentation level** (from `.editorconfig: indent_size=2` and
`google_checks.xml: basicOffset=2`).

Nesting depth in Checkstyle:

- Base class level = 0 spaces
- Class members (fields, methods) = 1 indent = 2 spaces
- Record parameters / method bodies = 2 indents = 4 spaces
- Continuation lines in methods = 3+ indents = 6+ spaces

**Examples:**

**✅ Correct (4 spaces = 2 levels × 2):**

```java
public record FastingSessionDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,

  @NotNull @Schema(description = "Session start time") Instant startTime,

  @Min(1) @Schema(description = "Target hours") int targetHours
) {

}
```

**❌ Incorrect (2 spaces = 1 level only):**

```java
public record FastingSessionDto(
  @Schema(accessMode = Schema.AccessMode.READ_ONLY) String id,
  @NotNull @Schema(description = "Session start time") Instant startTime
) {

}
```

### 3. Line Length (LineLength)

**Rule:** Lines must be ≤ 100 characters. Break long `@Schema` annotations and method signatures
across lines.

**Examples:**

**✅ Correct:**

```java

@Schema(
  description = "Last updated timestamp (server-managed)",
  accessMode = Schema.AccessMode.READ_ONLY
)
Instant updatedAt,

List<FoodItem> findByUserIdAndDateLoggedBetween(
  UserId userId,
  LocalDate startDate,
  LocalDate endDate
);
```

**❌ Incorrect:**

```java

@Schema(description = "Last updated timestamp (server-managed)", accessMode = Schema.AccessMode.READ_ONLY)
Instant updatedAt,

List<FoodItem> findByUserIdAndDateLoggedBetween(UserId userId, LocalDate startDate,
  LocalDate endDate);
```

### 3a. Method Body Indentation (CRITICAL - 400+ violations)

**Rule:** Method bodies continue the 2-space-per-level pattern. Continuation lines (wrapped chains,
builder calls) add another level.

**Current state:** 400+ indentation violations across entire codebase using wrong nesting levels.

**✅ Correct (2 spaces per level):**

```java
public void saveLog(ActivityLog log) {        // 1 level = 2 spaces
  final ActivityLog saved = repository.save(log);

  return builder
    .id(saved.getId())                      // 3 levels = 6 spaces (continuation)
    .userId(saved.getUserId())              // 3 levels = 6 spaces
    .build();                               // 3 levels = 6 spaces
}

@Test
void testCreateActivity() {                   // 1 level = 2 spaces
  ActivityLog log = ActivityLog.builder()
    .id("123")                              // 3 levels = 6 spaces
    .userId(userId)                         // 3 levels = 6 spaces
    .build();                               // 3 levels = 6 spaces
}
```

**❌ Incorrect (inconsistent/wrong levels):**

```java
public void saveLog(ActivityLog log) {
  final ActivityLog saved = repository.save(log);  // 4 spaces ❌ (should be 2)

  return builder
    .id(saved.getId())                             // 6 spaces ❌ should be 6 ✅
```

**Auto-fix:** IntelliJ: Select all → Code > Reformat Code (Cmd+Option+L / Ctrl+Alt+L). Ensure
`.editorconfig` is configured for 2-space indentation.

### 4. Method & Parameter Naming (MethodName)

**Rule:** Use camelCase for method and variable names; constants use UPPER_SNAKE_CASE. Test methods
should NOT use underscores between camelCase words.

**✅ Correct:**

```java
public FoodItem getFoodItemById(FoodItemId id) {
}

public static final int MAX_CALORIES = 5000;

@Test
void xForwardedForFirstIpUsedAsClientKey() {
}  // camelCase throughout
```

**❌ Incorrect:**

```java
public FoodItem getFoodItemById(FoodItemId id) {
}

@Test
void xForwardedFor_firstIpUsedAsClientKey() {
}  // underscores in test names violate pattern
```

### 5. Blank Lines

**Rule:** Use one blank line between fields/methods in classes. In records, keep one blank line
between logical groups.

**✅ Correct:**

```java
public record FoodItemDto(
  String id,

  @NotNull String name,
  int calories,

  @NotNull LocalDate dateLogged
) {

}
```

## Build & Check

Run Checkstyle before committing:

```bash
cd apps/backend
mvn clean install          # Runs checkstyle:check during validate phase
mvn checkstyle:checkstyle  # Generate report only (doesn't fail build)
```

## Common Fixes

| Issue                  | Fix                                                                              |
|------------------------|----------------------------------------------------------------------------------|
| Missing Javadoc        | Add `/** ... */` comment above public class/record/method                        |
| Indentation 2→4        | Use 4 spaces; select code in IDE and auto-indent (Cmd+I on Mac, Ctrl+I on Linux) |
| Line > 100 chars       | Break annotations and method signatures across lines                             |
| Space before `{`       | Add space: `if (...) {` not `if (...){`                                          |
| No trailing whitespace | Trim end-of-line spaces                                                          |

## Controllers, Services, Repositories

- **Controllers:** Javadoc on class + `@RequestMapping` endpoints
- **Services:** Javadoc on class + public methods
- **Repositories:** Javadoc on interface + custom query methods

All DTOs (request/response) must have Javadoc describing purpose and fields via `@Schema`.

## Checkstyle Suppressions

If a specific check is false-positive or intentional, suppress at line level (rare):

```java

@SuppressWarnings("checkstyle:MethodName")
public void someMethod() {
}
```

**Prefer fixing the style violation instead.** Suppressions should be exceptional and documented.

---

**Last Updated:** May 31, 2026 | **Checkstyle Version:** 13.4.2 (via Google Checks XML)
