package com.example.tableapp.api;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
public class DataController {
    @GetMapping(value = "/api/data", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<Map<String, Object>> getData() {
        return List.of(
            Map.of("id", 1, "nome", "Ana", "nota", 8.7, "turma", "1A"),
            Map.of("id", 2, "nome", "Bruno", "nota", 9.1, "turma", "1A"),
            Map.of("id", 3, "nome", "Clara", "nota", 7.5, "turma", "1B"),
            Map.of("id", 4, "nome", "Daniel", "nota", 6.9, "turma", "1B"),
            Map.of("id", 5, "nome", "Eva", "nota", 9.9, "turma", "1C")
        );
    }
}
