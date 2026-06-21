FROM maven:3.9.16-eclipse-temurin-25-alpine AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests -Pdocker package

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app

RUN addgroup -S gcalorai && adduser -S gcalorai -G gcalorai

COPY --chown=gcalorai:gcalorai --from=build /workspace/target/*.jar app.jar

USER gcalorai

EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
