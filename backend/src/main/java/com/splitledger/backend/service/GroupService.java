package com.splitledger.backend.service;

import com.splitledger.backend.dto.AddMemberRequest;
import com.splitledger.backend.dto.GroupDetailResponse;
import com.splitledger.backend.dto.GroupMemberResponse;
import com.splitledger.backend.dto.GroupRequest;
import com.splitledger.backend.dto.GroupResponse;
import com.splitledger.backend.entity.ExpenseGroup;
import com.splitledger.backend.entity.GroupMember;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.exception.BadRequestException;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.ForbiddenException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final UserRepository userRepository;

    @Transactional
    public GroupDetailResponse create(Long userId, GroupRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ExpenseGroup group = new ExpenseGroup();
        group.setName(request.name().trim());
        group.setCreatedBy(creator);
        groupRepository.save(group);

        // The creator is the first member, linked to their account.
        GroupMember self = new GroupMember();
        self.setGroup(group);
        self.setUser(creator);
        self.setDisplayName(creator.getName());
        memberRepository.save(self);

        return toDetail(group);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> list(Long userId) {
        List<ExpenseGroup> groups = groupRepository.findVisible(userId);
        if (groups.isEmpty()) {
            return List.of();
        }
        List<Long> ids = groups.stream().map(ExpenseGroup::getId).toList();
        Map<Long, Long> counts = new HashMap<>();
        memberRepository.countByGroupIds(ids).forEach(c -> counts.put(c.groupId(), c.count()));

        return groups.stream()
                .map(g -> new GroupResponse(
                        g.getId(), g.getName(), g.getCreatedBy().getId(), g.getCreatedAt(),
                        counts.getOrDefault(g.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupDetailResponse get(Long userId, Long groupId) {
        return toDetail(findVisible(userId, groupId));
    }

    @Transactional
    public GroupDetailResponse rename(Long userId, Long groupId, GroupRequest request) {
        ExpenseGroup group = findVisible(userId, groupId);
        requireCreator(userId, group, "rename the group");
        group.setName(request.name().trim());
        return toDetail(group);
    }

    @Transactional
    public void delete(Long userId, Long groupId) {
        ExpenseGroup group = findVisible(userId, groupId);
        requireCreator(userId, group, "delete the group");
        // Step 10 will block this when the group has expenses or settlements.
        memberRepository.deleteByGroupId(groupId);
        groupRepository.delete(group);
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> listMembers(Long userId, Long groupId) {
        findVisible(userId, groupId);
        return memberRepository.findByGroupIdOrderByIdAsc(groupId).stream()
                .map(this::toMember)
                .toList();
    }

    @Transactional
    public GroupMemberResponse addMember(Long userId, Long groupId, AddMemberRequest request) {
        ExpenseGroup group = findVisible(userId, groupId);

        boolean hasEmail = request.email() != null && !request.email().isBlank();
        boolean hasName = request.name() != null && !request.name().isBlank();
        if (hasEmail == hasName) {
            throw new BadRequestException(
                    "Provide exactly one of: email (registered user) or name (guest)");
        }

        GroupMember member = new GroupMember();
        member.setGroup(group);

        if (hasEmail) {
            String email = request.email().trim().toLowerCase(Locale.ROOT);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No registered user with that email. You can add them as a guest by name instead"));
            if (memberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
                throw new ConflictException("This user is already a member of the group");
            }
            member.setUser(user);
            member.setDisplayName(user.getName());
        } else {
            String name = request.name().trim();
            if (memberRepository.existsByGroupIdAndDisplayNameIgnoreCase(groupId, name)) {
                throw new ConflictException("A member named '" + name + "' already exists in this group");
            }
            member.setDisplayName(name);   // user stays null = guest
        }

        memberRepository.save(member);
        return toMember(member);
    }

    @Transactional
    public void removeMember(Long userId, Long groupId, Long memberId) {
        ExpenseGroup group = findVisible(userId, groupId);
        requireCreator(userId, group, "remove members");

        GroupMember member = memberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        if (member.getUser() != null && member.getUser().getId().equals(group.getCreatedBy().getId())) {
            throw new ConflictException("The group creator can't be removed");
        }
        // Step 10 will block this when the member has expenses, splits or settlements.
        memberRepository.delete(member);
    }

    // A group the user is a member of; anyone else gets 404.
    private ExpenseGroup findVisible(Long userId, Long groupId) {
        return groupRepository.findVisibleById(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }

    private void requireCreator(Long userId, ExpenseGroup group, String action) {
        if (!group.getCreatedBy().getId().equals(userId)) {
            throw new ForbiddenException("Only the group creator can " + action);
        }
    }

    private GroupDetailResponse toDetail(ExpenseGroup g) {
        List<GroupMemberResponse> members = memberRepository.findByGroupIdOrderByIdAsc(g.getId()).stream()
                .map(this::toMember)
                .toList();
        return new GroupDetailResponse(g.getId(), g.getName(), g.getCreatedBy().getId(), g.getCreatedAt(), members);
    }

    private GroupMemberResponse toMember(GroupMember m) {
        Long linkedUserId = m.getUser() == null ? null : m.getUser().getId();
        return new GroupMemberResponse(m.getId(), m.getDisplayName(), linkedUserId, linkedUserId == null);
    }
}