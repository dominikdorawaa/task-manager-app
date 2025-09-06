package com.taskmanager;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.taskmanager.model.User;
import com.taskmanager.model.Task;
import com.taskmanager.repository.UserRepository;
import com.taskmanager.repository.TaskRepository;

@SpringBootApplication
public class TaskManagerApplication {
    public static void main(String[] args) {
        SpringApplication.run(TaskManagerApplication.class, args);
    }

    @Bean
    public CommandLineRunner createTestUser(UserRepository userRepository, PasswordEncoder passwordEncoder, TaskRepository taskRepository) {
        return args -> {
            // Sprawdź czy użytkownik testowy już istnieje
            if (!userRepository.existsByUsername("demo")) {
                User testUser = new User();
                testUser.setUsername("demo");
                testUser.setEmail("demo@example.com");
                testUser.setPassword(passwordEncoder.encode("demo123"));

                userRepository.save(testUser);

                System.out.println("✅ Utworzono użytkownika testowego!");
                System.out.println("Username: demo");
                System.out.println("Email: demo@example.com");
                System.out.println("Hasło: demo123");
            } else {
                System.out.println("✅ Użytkownik testowy już istnieje!");
                System.out.println("Username: demo");
                System.out.println("Hasło: demo123");
            }

            // Dodaj zadania testowe
            User demoUser = userRepository.findByUsername("demo").orElse(null);
            if (demoUser != null && taskRepository.findByUser_Id(demoUser.getId()).isEmpty()) {
                Task task1 = new Task();
                task1.setTitle("Pierwsze zadanie testowe");
                task1.setDescription("To jest opis pierwszego zadania testowego");
                task1.setStatus(Task.TaskStatus.DO_ZROBIENIA);
                task1.setPriority(Task.TaskPriority.WYSOKI);
                task1.setUser(demoUser);
                taskRepository.save(task1);

                Task task2 = new Task();
                task2.setTitle("Drugie zadanie testowe");
                task2.setDescription("To jest opis drugiego zadania testowego");
                task2.setStatus(Task.TaskStatus.W_TRAKCIE);
                task2.setPriority(Task.TaskPriority.SREDNI);
                task2.setUser(demoUser);
                taskRepository.save(task2);

                Task task3 = new Task();
                task3.setTitle("Trzecie zadanie testowe");
                task3.setDescription("To jest opis trzeciego zadania testowego");
                task3.setStatus(Task.TaskStatus.ZAKONCZONE);
                task3.setPriority(Task.TaskPriority.NISKI);
                task3.setUser(demoUser);
                taskRepository.save(task3);

                System.out.println("✅ Utworzono zadania testowe!");
            } else {
                System.out.println("✅ Zadania testowe już istnieją lub użytkownik nie istnieje!");
            }
        };
    }
}
