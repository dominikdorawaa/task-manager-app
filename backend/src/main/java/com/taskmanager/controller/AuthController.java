package com.taskmanager.controller;

import com.taskmanager.model.User;
import com.taskmanager.security.JwtTokenProvider;
import com.taskmanager.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.username(),
                loginRequest.password()
            )
        );

        String jwt = tokenProvider.generateToken(authentication);
        
        // Pobierz dane użytkownika
        User user = userService.findByUsername(loginRequest.username());
        
        // Przygotuj odpowiedź
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("user", user);
        response.put("message", "Logowanie zakończone sukcesem");
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        // Utwórz nowy obiekt użytkownika z danymi z żądania
        User user = new User();
        user.setUsername(registerRequest.username());
        user.setEmail(registerRequest.email());
        user.setPassword(registerRequest.password());

        // Zapisz użytkownika - hasło zostanie zaszyfrowane w serwisie
        User newUser = userService.createUser(user);

        // Zaloguj użytkownika
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                registerRequest.username(),
                registerRequest.password() // Używamy oryginalnego, niezaszyfrowanego hasła
            )
        );

        String jwt = tokenProvider.generateToken(authentication);

        // Przygotuj odpowiedź
        Map<String, Object> response = new HashMap<>();
        response.put("user", newUser);
        response.put("token", jwt);
        response.put("message", "Rejestracja zakończona sukcesem");

        return ResponseEntity.ok(response);
    }
}

record LoginRequest(String username, String password) {}
record RegisterRequest(String username, String email, String password) {}
record JwtResponse(String token) {}
