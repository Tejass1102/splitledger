package com.splitledger.backend.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.List;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "SplitLedger API",
                version = "1.0",
                description = "Personal expense tracker with Splitwise-style group splitting"),
        security = @SecurityRequirement(name = "bearerAuth"))
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Log in at POST /api/auth/login, then paste the token here (without the word Bearer)")
public class OpenApiConfig {

    // Everything shows a lock except register and login, which are public.
    @Bean
    public OpenApiCustomizer publicAuthEndpoints() {
        return openApi -> {
            if (openApi.getPaths() == null) {
                return;
            }
            openApi.getPaths().forEach((path, item) -> {
                if (path.startsWith("/api/auth/")) {
                    item.readOperations().forEach(operation -> operation.setSecurity(List.of()));
                }
            });
        };
    }
}