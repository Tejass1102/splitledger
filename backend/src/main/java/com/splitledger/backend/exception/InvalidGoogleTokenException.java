package com.splitledger.backend.exception;

import org.springframework.security.core.AuthenticationException;

// Handled by the AuthenticationException handler in GlobalExceptionHandler: 401.
public class InvalidGoogleTokenException extends AuthenticationException {
    public InvalidGoogleTokenException(String message) {
        super(message);
    }
}