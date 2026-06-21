package com.gryffin.calorai.controller;

import com.gryffin.calorai.security.OidcVerificationException;
import io.jsonwebtoken.JwtException;
import jakarta.validation.ConstraintViolationException;
import java.util.NoSuchElementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler that maps domain exceptions to HTTP problem details.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(NoSuchElementException.class)
  public ProblemDetail handleNotFound(NoSuchElementException ex) {
    log.debug("Resource not found: {}", ex.getMessage());
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Resource not found");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ProblemDetail handleBadRequest(IllegalArgumentException ex) {
    log.debug("Bad request: {}", ex.getMessage());
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request");
  }

  @ExceptionHandler(SecurityException.class)
  public ProblemDetail handleSecurity(SecurityException ex) {
    log.warn("Security exception: {}", ex.getMessage());
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication failed");
  }

  @ExceptionHandler(JwtException.class)
  public ProblemDetail handleJwt(JwtException ex) {
    log.warn("JWT error: {}", ex.getMessage());
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication failed");
  }

  @ExceptionHandler(OidcVerificationException.class)
  public ProblemDetail handleOidc(OidcVerificationException ex) {
    log.warn("OIDC verification failed: {}", ex.getMessage());
    return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Authentication failed");
  }

  /**
   * Maps Bean Validation constraint violations (from @Validated path/query params) to 400.
   *
   * @param ex the constraint violation exception
   * @return a 400 Bad Request problem detail
   */
  @ExceptionHandler(ConstraintViolationException.class)
  public ProblemDetail handleConstraintViolation(ConstraintViolationException ex) {
    log.debug("Constraint violation: {}", ex.getMessage());
    var detail = ex.getConstraintViolations().stream()
      .map(cv -> cv.getPropertyPath() + ": " + cv.getMessage())
      .findFirst()
      .orElse("Validation failed");
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
    var detail = ex.getBindingResult().getFieldErrors().stream()
      .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
      .findFirst()
      .orElse("Validation failed");
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
  }

  @ExceptionHandler(Exception.class)
  public ProblemDetail handleGeneric(Exception ex) {
    log.error("Unexpected error", ex);
    return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
      "An unexpected error occurred");
  }
}
