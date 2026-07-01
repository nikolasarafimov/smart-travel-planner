FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -Dmaven.test.skip=true

RUN JAR_FILE=$(find target -maxdepth 1 -type f -name "*.jar" ! -name "*original*" | head -n 1) && cp "$JAR_FILE" app.jar

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/app.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]