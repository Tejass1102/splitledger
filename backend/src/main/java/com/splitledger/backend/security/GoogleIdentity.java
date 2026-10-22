package com.splitledger.backend.security;

// What we trust from a verified Google token: the stable id, the verified email and a display name.
public record GoogleIdentity(String googleId, String email, String name) {}