package com.splitledger.backend.repository;

import com.splitledger.backend.entity.Category;
import com.splitledger.backend.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    // Defaults (user is null) plus the user's own categories
    @Query("select c from Category c where c.user is null or c.user.id = :userId "
            + "order by c.type, lower(c.name)")
    List<Category> findVisible(@Param("userId") Long userId);

    @Query("select c from Category c where c.id = :id and (c.user is null or c.user.id = :userId)")
    Optional<Category> findVisibleById(@Param("id") Long id, @Param("userId") Long userId);

    Optional<Category> findFirstByUserIsNullAndNameIgnoreCaseAndType(String name, CategoryType type);

    boolean existsByUserIsNullAndNameIgnoreCaseAndType(String name, CategoryType type);

    boolean existsByUserIdAndNameIgnoreCaseAndType(Long userId, String name, CategoryType type);

    boolean existsByUserIdAndNameIgnoreCaseAndTypeAndIdNot(Long userId, String name,
                                                           CategoryType type, Long id);
}