package com.taskmanager.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Base64;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Slf4j
public class ClerkAuthenticationFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                  HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            log.info("Processing request to: {} with JWT: {}", request.getRequestURI(), jwt != null ? "present" : "absent");

            if (StringUtils.hasText(jwt)) {
                String userId = extractUserIdFromClerkToken(jwt);
                if (userId != null) {
                    log.info("Valid Clerk token for user: {}", userId);

                    // Tworzenie Authentication z Clerk User ID
                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("Authentication set for Clerk user: {}", userId);
                } else {
                    log.warn("Invalid Clerk token for request to: {}", request.getRequestURI());
                }
            } else {
                log.warn("No JWT token found for request to: {}", request.getRequestURI());
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private String extractUserIdFromClerkToken(String token) {
        try {
            // Parsowanie JWT tokenu Clerk
            String[] chunks = token.split("\\.");
            if (chunks.length != 3) {
                return null;
            }

            // Dekodowanie payload
            String payload = new String(Base64.getUrlDecoder().decode(chunks[1]));
            JsonNode jsonNode = objectMapper.readTree(payload);
            
            // Clerk używa "sub" jako user ID
            return jsonNode.get("sub").asText();
        } catch (Exception e) {
            log.error("Error parsing Clerk token", e);
            return null;
        }
    }
}
