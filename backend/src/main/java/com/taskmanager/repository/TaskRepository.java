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
    // Znajdź zadania przypisane do użytkownika (JSON array zawiera userId)
    @Query("SELECT t FROM Task t WHERE t.assignedTo LIKE CONCAT('%', :assignedTo, '%') AND t.clerkUserId <> :clerkUserId")
    List<Task> findByAssignedToContainingAndClerkUserIdNot(@Param("assignedTo") String assignedTo, @Param("clerkUserId") String clerkUserId);
    
    // Znajdź zadania udostępnione użytkownikowi (gdzie użytkownik jest w sharedWith)
    List<Task> findBySharedWithContainingAndClerkUserIdNot(String userId, String excludeUserId);
}
