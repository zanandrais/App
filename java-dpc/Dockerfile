FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY Main.java .
RUN javac Main.java

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/Main.class /app/
ENV PORT=8080
EXPOSE 8080
CMD ["java", "Main"]

