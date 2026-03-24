package tz.co.dseroboadvisor.roboadvisor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RoboadvisorApplication {

	public static void main(String[] args) {
		SpringApplication.run(RoboadvisorApplication.class, args);
	}

}
