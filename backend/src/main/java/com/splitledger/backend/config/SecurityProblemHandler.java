package com.splitledger.backend.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;

/**
 * Writes 401 and 403 answers from the security filter chain in the same ProblemDetail
 * JSON shape as the rest of the API. These happen before a controller runs, so
 * GlobalExceptionHandler can't produce them.
 */
@Component
public class SecurityProblemHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException ex) throws IOException, ServletException {
        write(request, response, 401, "Unauthorized",
                "Authentication is required. Send a valid Bearer token");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException ex) throws IOException, ServletException {
        write(request, response, 403, "Forbidden", "You don't have permission to do this");
    }

    private void write(HttpServletRequest request, HttpServletResponse response,
                       int status, String title, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        String body = "{\"type\":\"about:blank\""
                + ",\"title\":\"" + title + "\""
                + ",\"status\":" + status
                + ",\"detail\":\"" + detail + "\""
                + ",\"instance\":\"" + escape(request.getRequestURI()) + "\"}";
        response.getWriter().write(body);
    }

    // title and detail are fixed texts; only the request path needs escaping
    private String escape(String value) {
        StringBuilder out = new StringBuilder();
        for (char c : value.toCharArray()) {
            if (c == '"' || c == '\\') {
                out.append('\\').append(c);
            } else if (c >= 0x20) {
                out.append(c);
            }
        }
        return out.toString();
    }
}