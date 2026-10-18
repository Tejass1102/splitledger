package com.splitledger.backend.service;

import com.splitledger.backend.dto.GroupMemberResponse;
import com.splitledger.backend.dto.LinkMemberRequest;
import com.splitledger.backend.entity.ExpenseGroup;
import com.splitledger.backend.entity.GroupMember;
import com.splitledger.backend.entity.User;
import com.splitledger.backend.exception.ConflictException;
import com.splitledger.backend.exception.ForbiddenException;
import com.splitledger.backend.exception.ResourceNotFoundException;
import com.splitledger.backend.repository.GroupMemberRepository;
import com.splitledger.backend.repository.GroupRepository;
import com.splitledger.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MemberLinkService {
    private final GroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final UserRepository userRepository;

    /**
     * Attaches a registered account to a guest member. Only the member's user_id changes,
     * so every expense, share and settlement that points to this member now belongs to the account.
     */
    @Transactional
    public GroupMemberResponse link(Long userId, Long groupId, Long memberId, LinkMemberRequest request) {
        ExpenseGroup group = groupRepository.findVisibleById(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
        if (!group.getCreatedBy().getId().equals(userId)) {
            throw new ForbiddenException("Only the group creator can link a guest to an account");
        }

        GroupMember member = memberRepository.findByIdAndGroupId(memberId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (member.getUser() != null) {
            throw new ConflictException("This member already has an account and can't be linked again");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        User account = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No registered user with that email. Ask them to sign up first, then link again"));

        if (memberRepository.existsByGroupIdAndUserId(groupId, account.getId())) {
            throw new ConflictException("This user is already a member of the group under another name");
        }

        member.setUser(account);   // displayName is kept: the group's history refers to that name
        return new GroupMemberResponse(member.getId(), member.getDisplayName(), account.getId(), false);
    }
}