FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .

RUN mvn --batch-mode --no-transfer-progress dependency:go-offline

COPY src ./src

RUN mvn --batch-mode --no-transfer-progress clean package -DskipTests \
    && JAR_FILE=$(find target -maxdepth 1 -type f -name "*.jar" ! -name "*original*" | head -n 1) \
    && test -n "$JAR_FILE" \
    && cp "$JAR_FILE" app.jar

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/app.jar app.jar

EXPOSE 8080

USER 1001

ENTRYPOINT ["java", "-jar", "app.jar"]