package com.gryffin.calorai.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for system liveness and status endpoints.
 */
@Tag(name = "System", description = "System status endpoints")
@RestController
@RequestMapping("/v1")
public class HealthController {

  @Operation(summary = "Liveness check - returns 200 if server is running")
  @GetMapping("/ping")
  public Map<String, String> ping() {
    return Map.of("status", "ok", "service", "calorai-backend");
  }
}
