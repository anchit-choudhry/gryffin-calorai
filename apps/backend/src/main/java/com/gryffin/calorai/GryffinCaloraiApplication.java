package com.gryffin.calorai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class GryffinCaloraiApplication {
    public static void main(String[] args) {
        SpringApplication.run(GryffinCaloraiApplication.class, args);
    }
}
