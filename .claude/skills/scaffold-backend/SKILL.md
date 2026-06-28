---
name: scaffold-backend
description: Scaffold a new Spring Boot endpoint with controller, service,
  repository, and DTO - pre-wired with Javadoc, Checkstyle-compliant
  indentation, and @Schema annotations.
disable-model-invocation: true
---

# Backend Scaffold

Scaffold a complete Spring Boot endpoint for the resource named in the argument
(e.g. `/scaffold-backend meal-plan` produces `MealPlan*` files).

## Steps

1. **Derive names** from the argument:

- kebab-case argument -> PascalCase class prefix (`meal-plan` -> `MealPlan`)
- Package path: `com.gryffin.calorai.<resource>` (use the plural snake_case:
  `mealplan`)

2. **Create `{Name}Dto.java`** (request/response record):

- Class-level `/** Javadoc describing purpose. */`
- Record parameters at 4-space indent (2 levels)
- `@Schema(description = "...")` on every field; break lines > 100 chars
- Blank line between logical field groups
- `@NotNull` / `@Min` / `@Size` on validated fields

3. **Create `{Name}Controller.java`**:

- Class-level Javadoc
- `@RestController`, `@RequestMapping("/gryffin/calorai/api/{resources}")`
- Javadoc on every `@GetMapping` / `@PostMapping` / `@PutMapping` /
  `@DeleteMapping` method
- Method bodies at 4-space indent; continuation lines at 6+ spaces
- `@PreAuthorize("isAuthenticated()")` on all endpoints

4. **Create `{Name}Service.java`**:

- Class-level Javadoc
- `@Service` annotation
- Javadoc on every public method (summary + `@param` + `@return`)

5. **Create `{Name}Repository.java`**:

- Interface-level Javadoc
- Extends `JpaRepository<{Name}, String>`
- Javadoc on every custom query method with `@param` and `@return`

6. **Verify before presenting**:

- No line exceeds 100 characters (break `@Schema` annotations that do)
- All public classes and methods have `/** */` Javadoc
- 2-space per indentation level throughout
- No trailing whitespace

7. **Print after generating**: "Run `mvn checkstyle:check` from `apps/backend/`
   to verify style compliance."

## Checkstyle Quick Reference

| Requirement  | Detail                                                                                   |
|--------------|------------------------------------------------------------------------------------------|
| Indentation  | 2 spaces = 1 level; record params = 4 spaces; method body = 4 spaces; continuations = 6+ |
| Line length  | Max 100 chars; break long `@Schema` and method signatures                                |
| Javadoc      | All public classes, records, interfaces, and methods                                     |
| Method names | camelCase; no underscores (including test methods)                                       |
| Constants    | `UPPER_SNAKE_CASE`                                                                       |

See `@@.claude/rules/backend.md` for full Checkstyle rules.
