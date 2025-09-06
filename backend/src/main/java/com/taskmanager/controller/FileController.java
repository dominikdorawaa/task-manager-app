package com.taskmanager.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/files")
public class FileController {

    // Katalog do przechowywania plików
    private final String uploadDir = "uploads/images/";
    
    // Dozwolone typy plików
    private final Set<String> allowedTypes = Set.of("image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp");
    
    // Maksymalny rozmiar pliku (5MB)
    private final long maxFileSize = 5 * 1024 * 1024;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFiles(@RequestParam("files") MultipartFile[] files) {
        try {
            // Tworzenie katalogu jeśli nie istnieje
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<String> uploadedFiles = new ArrayList<>();
            
            for (MultipartFile file : files) {
                // Walidacja pliku
                if (file.isEmpty()) {
                    continue;
                }
                
                // Sprawdzenie typu pliku
                if (!allowedTypes.contains(file.getContentType())) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Nieprawidłowy typ pliku: " + file.getContentType()));
                }
                
                // Sprawdzenie rozmiaru
                if (file.getSize() > maxFileSize) {
                    return ResponseEntity.badRequest()
                        .body(Map.of("error", "Plik jest za duży. Maksymalny rozmiar to 5MB"));
                }
                
                // Generowanie unikalnej nazwy pliku
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                String filename = UUID.randomUUID().toString() + extension;
                
                // Zapisywanie pliku
                Path filePath = uploadPath.resolve(filename);
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                
                uploadedFiles.add("/api/files/images/" + filename);
            }
            
            return ResponseEntity.ok(Map.of("files", uploadedFiles));
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Błąd podczas uploadu plików: " + e.getMessage()));
        }
    }

    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // Określenie typu MIME
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                
                return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/images/{filename}")
    public ResponseEntity<?> deleteImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);
            
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(Map.of("message", "Plik został usunięty"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Błąd podczas usuwania pliku: " + e.getMessage()));
        }
    }
}
