package com.warehouse;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashHelper {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        System.out.println("HASH_GEN_START:" + encoder.encode("admin123") + ":HASH_GEN_END");
    }
}
