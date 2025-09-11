package com.taskmanager.repository;

import com.taskmanager.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUser_Id(Long userId);
    List<Task> findByUser_IdAndStatus(Long userId, Task.TaskStatus status);
    List<Task> findByStatus(Task.TaskStatus status);
    List<Task> findByClerkUserId(String clerkUserId);
    List<Task> findByAssignedToAndClerkUserIdNot(String assignedTo, String clerkUserId);
    
    // Znajdź zadania przypisane do użytkownika (uwzględniając ID z nawiasami)
    @Query("SELECT t FROM Task t WHERE (t.assignedTo = :assignedTo OR t.assignedTo LIKE :assignedToWithSpace OR t.assignedTo LIKE :assignedToWithParen) AND t.clerkUserId != :clerkUserId")
    List<Task> findByAssignedToLikeAndClerkUserIdNot(@Param("assignedTo") String assignedTo, @Param("assignedToWithSpace") String assignedToWithSpace, @Param("assignedToWithParen") String assignedToWithParen, @Param("clerkUserId") String clerkUserId);
    
    // Alternatywna metoda - znajdź zadania przypisane do użytkownika (prostsze zapytanie)
    List<Task> findByAssignedToContainingAndClerkUserIdNot(String assignedTo, String clerkUserId);
    
    // Znajdź zadania udostępnione użytkownikowi (gdzie użytkownik jest w sharedWith)
    List<Task> findBySharedWithContainingAndClerkUserIdNot(String userId, String excludeUserId);
}
