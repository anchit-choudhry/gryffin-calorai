# Scaffold Backend Skill

> Full scaffold instructions: `.claude/skills/scaffold-backend/SKILL.md`
> Backend code style and Checkstyle rules: `.claude/rules/backend.md`

Follow the scaffold process documented in those files to generate a complete Spring Boot endpoint
(controller, service, repository, DTO) pre-wired with Javadoc and Checkstyle-compliant style.

## Package structure

Base package: `com.gryffin.calorai`

| Layer      | Location                                                                |
|------------|-------------------------------------------------------------------------|
| Controller | `apps/backend/src/main/java/com/gryffin/calorai/<resource>/`            |
| Service    | same package                                                            |
| Repository | same package                                                            |
| DTO        | same package                                                            |
| Migration  | `apps/backend/src/main/resources/db/migration/V{N}__add_<resource>.sql` |

## Required conventions (enforced by Checkstyle)

- **Javadoc** on every public class, record, interface, and public method
- **2-space indentation** per level (4 spaces = class members; 6 spaces = continuation lines)
- **Line length** max 100 characters; break long `@Schema` annotations across lines
- **`@Schema`** annotations on all DTO fields
- **`@Validated`** on controller class; constraint annotations on all DTO fields

## Quick commands

```bash
cd apps/backend
mvn clean install          # Checkstyle runs at validate phase; build fails on violations
mvn checkstyle:checkstyle  # report only - does not fail the build
```
